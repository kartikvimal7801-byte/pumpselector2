// Cloud Sync Module for Firebase Firestore
// Syncs database files across all devices

class CloudSync {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.syncEnabled = false;
  }

  // Initialize Firebase (will be called after Firebase is loaded)
  async init() {
    if (this.isInitialized) return;

    try {
      // Check if Firebase is available
      if (typeof firebase === 'undefined') {
        console.warn('Firebase not loaded. Cloud sync disabled.');
        return false;
      }

      // Initialize Firebase (config will be set via setConfig)
      if (!firebase.apps.length) {
        // Firebase will be initialized by the HTML page
        console.log('Waiting for Firebase initialization...');
        return false;
      }

      this.db = firebase.firestore();
      this.isInitialized = true;
      this.syncEnabled = true;
      console.log('Cloud sync initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize cloud sync:', error);
      this.syncEnabled = false;
      return false;
    }
  }

  // Set Firebase config (called from HTML)
  setConfig(config) {
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK not loaded');
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
        this.db = firebase.firestore();
        this.isInitialized = true;
        this.syncEnabled = true;
        console.log('Firebase initialized with config');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    }
  }

  // Save database file to cloud
  async saveDatabaseFileToCloud(fileData) {
    if (!this.syncEnabled || !this.db) {
      console.warn('Cloud sync not available');
      return false;
    }

    try {
      const fileRef = this.db.collection('databaseFiles').doc(fileData.id.toString());
      await fileRef.set({
        id: fileData.id,
        fileName: fileData.fileName,
        fileData: fileData.fileData,
        fileType: fileData.fileType || 'json',
        forSelection: fileData.forSelection || false,
        forSpares: fileData.forSpares || false,
        timestamp: fileData.timestamp || new Date().toISOString(),
        uploadedAt: fileData.uploadedAt || Date.now(),
        updatedAt: Date.now()
      }, { merge: true });

      console.log('File saved to cloud:', fileData.fileName);
      return true;
    } catch (error) {
      console.error('Failed to save file to cloud:', error);
      return false;
    }
  }

  // Get all database files from cloud
  async getAllDatabaseFilesFromCloud() {
    if (!this.syncEnabled || !this.db) {
      console.warn('Cloud sync not available');
      return [];
    }

    try {
      const snapshot = await this.db.collection('databaseFiles').get();
      const files = [];
      
      snapshot.forEach(doc => {
        files.push(doc.data());
      });

      console.log('Files loaded from cloud:', files.length);
      return files;
    } catch (error) {
      console.error('Failed to load files from cloud:', error);
      return [];
    }
  }

  // Get file assigned for selection from cloud
  async getDatabaseFileForSelectionFromCloud() {
    if (!this.syncEnabled || !this.db) {
      return null;
    }

    try {
      const snapshot = await this.db.collection('databaseFiles')
        .where('forSelection', '==', true)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Failed to get selection file from cloud:', error);
      return null;
    }
  }

  // Get file assigned for spares from cloud
  async getDatabaseFileForSparesFromCloud() {
    if (!this.syncEnabled || !this.db) {
      return null;
    }

    try {
      const snapshot = await this.db.collection('databaseFiles')
        .where('forSpares', '==', true)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
      return null;
    } catch (error) {
      console.error('Failed to get spares file from cloud:', error);
      return null;
    }
  }

  // Update file assignment in cloud
  async updateFileAssignmentInCloud(fileId, updates) {
    if (!this.syncEnabled || !this.db) {
      return false;
    }

    try {
      const fileRef = this.db.collection('databaseFiles').doc(fileId.toString());
      await fileRef.update({
        ...updates,
        updatedAt: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Failed to update file assignment in cloud:', error);
      return false;
    }
  }

  // Delete file from cloud
  async deleteFileFromCloud(fileId) {
    if (!this.syncEnabled || !this.db) {
      console.warn('Cloud sync not enabled, cannot delete from cloud');
      return false;
    }

    try {
      const fileIdStr = fileId.toString();
      console.log('Deleting file from cloud:', fileIdStr);
      await this.db.collection('databaseFiles').doc(fileIdStr).delete();
      console.log('File successfully deleted from cloud:', fileIdStr);
      return true;
    } catch (error) {
      console.error('Failed to delete file from cloud:', error);
      console.error('Error details:', {
        fileId: fileId,
        fileIdType: typeof fileId,
        errorMessage: error.message
      });
      return false;
    }
  }

  // Sync all files from cloud to local IndexedDB
  async syncFromCloudToLocal(pumpDB) {
    if (!this.syncEnabled || !this.db) {
      return;
    }

    // Prevent multiple simultaneous syncs
    if (this._syncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this._syncing = true;

    try {
      console.log('Syncing files from cloud to local...');
      const cloudFiles = await this.getAllDatabaseFilesFromCloud();
      // Skip cloud sync to prevent infinite loop
      const localFiles = await pumpDB.getAllDatabaseFiles(true);

      // Create a map of local files by ID
      const localMap = new Map();
      localFiles.forEach(file => {
        localMap.set(file.id, file);
      });

      // Get all cloud file IDs (normalize to strings for comparison)
      const cloudFileIds = new Set();
      cloudFiles.forEach(f => {
        // Handle both string and number IDs
        const id = f.id ? f.id.toString() : null;
        if (id) cloudFileIds.add(id);
      });
      
      console.log('Cloud file IDs:', Array.from(cloudFileIds));
      console.log('Local files count:', localFiles.length);
      
      // Delete local files that don't exist in cloud (were deleted on another device)
      // Disabled to prevent auto-deletion of local files
      /*
      for (const localFile of localFiles) {
        const localFileIdStr = localFile.id ? localFile.id.toString() : null;
        if (localFileIdStr && !cloudFileIds.has(localFileIdStr)) {
          // File exists locally but not in cloud - delete it
          console.log('File deleted from cloud, removing from local:', localFile.fileName, 'ID:', localFileIdStr);
          const transaction = pumpDB.db.transaction(['databaseFiles'], 'readwrite');
          const store = transaction.objectStore('databaseFiles');
          await new Promise((resolve, reject) => {
            const deleteReq = store.delete(localFile.id);
            deleteReq.onsuccess = () => {
              console.log('Successfully deleted local file (removed from cloud):', localFile.fileName);
              resolve();
            };
            deleteReq.onerror = (e) => {
              console.error('Error deleting local file:', e);
              reject(deleteReq.error);
            };
          });
        }
      }
      */

      // Sync each cloud file to local
      for (const cloudFile of cloudFiles) {
        const cloudFileId = cloudFile.id.toString();
        const localFile = localFiles.find(f => f.id.toString() === cloudFileId);
        
        if (!localFile || (cloudFile.updatedAt || 0) > (localFile.updatedAt || 0)) {
          // Cloud file is newer or doesn't exist locally, sync it
          const transaction = pumpDB.db.transaction(['databaseFiles'], 'readwrite');
          const store = transaction.objectStore('databaseFiles');
          
          // Remove old file if exists
          if (localFile) {
            await new Promise((resolve, reject) => {
              const deleteReq = store.delete(localFile.id);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
            });
          }

          // Add cloud file
          await new Promise((resolve, reject) => {
            const addReq = store.add(cloudFile);
            addReq.onsuccess = () => resolve();
            addReq.onerror = () => reject(addReq.error);
          });

          console.log('Synced file from cloud:', cloudFile.fileName);
        }
      }

      console.log('Cloud sync to local completed');
    } catch (error) {
      console.error('Failed to sync from cloud to local:', error);
    } finally {
      this._syncing = false;
    }
  }

  // Sync all files from local to cloud
  async syncFromLocalToCloud(pumpDB) {
    if (!this.syncEnabled || !this.db) {
      return;
    }

    try {
      console.log('Syncing files from local to cloud...');
      const localFiles = await pumpDB.getAllDatabaseFiles();

      for (const localFile of localFiles) {
        await this.saveDatabaseFileToCloud(localFile);
      }

      console.log('Local sync to cloud completed');
    } catch (error) {
      console.error('Failed to sync from local to cloud:', error);
    }
  }
}

// Create global cloud sync instance
const cloudSync = new CloudSync();

