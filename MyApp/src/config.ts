/**
 * Application Configuration
 *
 * Change API_BASE_URL based on your environment:
 * - Android Emulator: http://10.0.2.2:5000
 * - Physical Device:  http://<YOUR_PC_LAN_IP>:5000
 * - Production:       https://your-production-api.com
 */

const Config = {
  // Backend API base URL — Android emulator must use 10.0.2.2 (maps to host machine's localhost)
  // Physical device: use your PC's LAN IP e.g. http://192.168.1.x:5000
  // Production: https://your-production-api.com
  API_BASE_URL: 'http://127.0.0.1:5000',


  // App metadata
  APP_NAME: 'FraudShield',
  APP_VERSION: '1.0.0',

  // Token storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@auth_access_token',
    REFRESH_TOKEN: '@auth_refresh_token',
    USER_DATA: '@auth_user_data',
  },

  // Request timeout in milliseconds (30s to allow ML inference time)
  REQUEST_TIMEOUT: 30000,
};

export default Config;
