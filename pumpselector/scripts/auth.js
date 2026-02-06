// Authentication Manager for Smart Pump Application
// Handles user signup, login, and session management

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.sessionKey = 'smartPump_currentUser';
    this.loadSession();
  }

  // Load user session from localStorage
  loadSession() {
    try {
      const storedUser = localStorage.getItem(this.sessionKey);
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.currentUser = null;
    }
  }

  // Save user session to localStorage
  saveSession(user) {
    try {
      // Don't store password in session
      const { password, ...userWithoutPassword } = user;
      this.currentUser = userWithoutPassword;
      localStorage.setItem(this.sessionKey, JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // Clear user session
  clearSession() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.sessionKey);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  // Get current logged-in user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Check if current user is admin
  isAdmin() {
    if (!this.currentUser) return false;
    const adminEmail = 'kartikvimal7801@gmail.com';
    return this.currentUser.email && this.currentUser.email.toLowerCase() === adminEmail.toLowerCase();
  }

  // Signup new user
  async signup(fullName, email, phone, password) {
    try {
      // Validate inputs
      if (!fullName || !email || !password) {
        return {
          success: false,
          message: 'Full name, email, and password are required'
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Please enter a valid email address'
        };
      }

      // Ensure database is initialized
      if (!pumpDB.db) {
        await pumpDB.init();
      }

      // Save user to database
      const user = await pumpDB.saveUser({
        fullName,
        email,
        phone,
        password // In production, hash this password
      });

      // Auto-login after signup
      this.saveSession(user);

      return {
        success: true,
        message: 'Account created successfully!',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        }
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create account. Please try again.'
      };
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          message: 'Email and password are required'
        };
      }

      // Ensure database is initialized
      if (!pumpDB.db) {
        await pumpDB.init();
      }

      // Check for admin account first
      const adminEmail = 'kartikvimal7801@gmail.com';
      const adminPassword = 'Agraparas';
      
      if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
        // Create admin user object
        const adminUser = {
          id: 'admin',
          fullName: 'Admin',
          email: adminEmail,
          phone: '',
          isAdmin: true
        };
        this.saveSession(adminUser);
        return {
          success: true,
          message: 'Admin login successful!',
          user: adminUser
        };
      }

      // Get user from database
      const user = await pumpDB.getUserByEmail(email);

      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Check password (in production, compare hashed passwords)
      if (user.password !== password) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Save session
      this.saveSession(user);

      return {
        success: true,
        message: 'Login successful!',
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login. Please try again.'
      };
    }
  }

  // Logout user
  logout() {
    this.clearSession();
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  // Update user profile (optional feature)
  async updateProfile(userId, updates) {
    try {
      if (!this.isLoggedIn() || this.currentUser.id !== userId) {
        return {
          success: false,
          message: 'Unauthorized'
        };
      }

      // Ensure database is initialized
      if (!pumpDB.db) {
        await pumpDB.init();
      }

      // Get current user
      const user = await pumpDB.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Update user data
      const updatedUser = {
        ...user,
        ...updates,
        updatedAt: Date.now()
      };

      // Save updated user (would need update method in database)
      // For now, we'll just update the session
      this.saveSession(updatedUser);

      return {
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile. Please try again.'
      };
    }
  }
}

// Create global auth manager instance
const authManager = new AuthManager();

