import { clerkClient } from '@clerk/express';

export const protectAdmin = async (req, res, next) => {
  try {
    const auth = req.auth();
    console.log('Auth object:', auth); // Debug log
    
    const { userId } = auth;
    if (!userId) {
      console.log('No user ID found in auth object');
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID' });
    }

    console.log('User ID:', userId); // Debug log
    
    const user = await clerkClient.users.getUser(userId);
    console.log('User role:', user.privateMetadata?.role); // Debug log

    if (user.privateMetadata?.role !== 'admin') {
      console.log('User does not have admin role');
      return res.status(403).json({ success: false, message: 'Access Denied! Admin privileges required.' });
    }

    console.log('Admin access granted'); // Debug log
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ success: false, message: 'Authorization failed: ' + error.message });
  }
};
