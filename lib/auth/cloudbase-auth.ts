import jwt from 'jsonwebtoken';
import { getCloudBaseDatabase, CloudBaseCollections, nowISO } from '../database/cloudbase-client';

interface CloudBaseUser {
  _id?: string;
  email: string | null;
  password?: string | null;
  name: string | null;
  avatar?: string | null;
  pro: boolean;
  region: string;

  // 微信登录相关字段
  wechatOpenId?: string;
  wechatUnionId?: string | null;

  // 订阅相关字段
  subscriptionTier?: string;
  plan?: string | null;
  plan_exp?: string | null;
  paymentMethod?: string | null;
  hide_ads?: boolean;

  // 时间戳
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

/**
 * CloudBase 微信登录认证服务
 */
export async function cloudbaseSignInWithWechat(params: {
  openid: string;
  unionid?: string | null;
  nickname?: string | null;
  avatar?: string | null;
}) {
  const { openid, unionid, nickname, avatar } = params;

  try {
    const db = getCloudBaseDatabase();
    const usersCollection = db.collection(CloudBaseCollections.USERS);
    const now = nowISO();

    console.log(`[CloudBase Auth] Processing WeChat login for openid: ${openid}`);

    // 1. 查找现有用户（优先按 wechatOpenId，其次按 email）
    let userResult = await usersCollection.where({ wechatOpenId: openid }).get();

    // 兼容早期用 email 存储 openid 的情况
    if (!userResult.data || userResult.data.length === 0) {
      const wechatEmail = `wechat_${openid}@local.wechat`;
      userResult = await usersCollection.where({ email: wechatEmail }).get();
    }

    let user: CloudBaseUser;

    if (userResult.data && userResult.data.length > 0) {
      // 现有用户：更新登录信息
      user = userResult.data[0] as CloudBaseUser;

      console.log(`[CloudBase Auth] Found existing user: ${user.email}`);

      // 更新用户信息
      const updateData: Partial<CloudBaseUser> = {
        lastLoginAt: now,
        updatedAt: now,
      };

      // 只在有新信息且不同的情况下更新
      if (nickname && nickname !== user.name) {
        updateData.name = nickname;
      }
      if (avatar && avatar !== user.avatar) {
        updateData.avatar = avatar;
      }

      // 如果有unionid但用户没有，更新unionid
      if (unionid && !user.wechatUnionId) {
        updateData.wechatUnionId = unionid;
      }

      // 如果有更新数据，执行更新
      if (Object.keys(updateData).length > 2) { // 除了lastLoginAt和updatedAt还有其他更新
        await usersCollection.doc(user._id!).update(updateData);
        console.log(`[CloudBase Auth] Updated user info for: ${user.email}`);
      }

      user = { ...user, ...updateData };

    } else {
      // 新用户：创建用户记录
      console.log(`[CloudBase Auth] Creating new user for openid: ${openid}`);

      const newUser: Omit<CloudBaseUser, '_id'> = {
        email: `wechat_${openid}@local.wechat`,
        password: null,
        name: nickname || '微信用户',
        avatar: avatar || null,
        pro: false,
        region: 'CN',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        wechatOpenId: openid,
        wechatUnionId: unionid || null,
        subscriptionTier: 'free',
        plan: 'free',
        plan_exp: null,
        paymentMethod: null,
        hide_ads: false,
      };

      const result = await usersCollection.add(newUser);
      user = { _id: result.id, ...newUser };

      console.log(`[CloudBase Auth] Created new user: ${user.email} (${user._id})`);
    }

    // 2. 生成 JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        region: 'CN',
        wechatOpenId: openid,
        type: 'access'
      },
      jwtSecret,
      { expiresIn: user.pro ? '90d' : '1h' } // Pro 用户 90 天，普通用户 1 小时
    );

    const refreshToken = jwt.sign(
      {
        userId: user._id,
        type: 'refresh',
        region: 'CN'
      },
      jwtSecret,
      { expiresIn: '7d' } // 7 天
    );

    console.log(`[CloudBase Auth] Generated tokens for user: ${user.email}`);

    return {
      success: true,
      user,
      accessToken,
      refreshToken,
      tokenMeta: {
        accessTokenExpiresIn: user.pro ? 90 * 24 * 60 * 60 : 60 * 60,
        refreshTokenExpiresIn: 7 * 24 * 60 * 60,
      },
    };

  } catch (error) {
    console.error('[CloudBase Auth] Error during WeChat authentication:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}