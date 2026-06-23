import { clerkClient, getAuth } from '@clerk/express';

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID' });
    }

    const user = await clerkClient.users.getUser(userId);
    if (user.privateMetadata?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied! Admin privileges required.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Authorization failed: ' + error.message });
  }
};

