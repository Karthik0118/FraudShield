/**
 * Application Configuration
 *
 * Change API_BASE_URL based on your environment:
 * - Android Emulator: http://10.0.2.2:5000
 * - Physical Device:  http://<YOUR_PC_LAN_IP>:5000
 * - Production:       https://your-production-api.com
 */

const Config = {
  // Backend API base URL — change this to match your environment
  API_BASE_URL: 'http://localhost:5000',


  // App metadata
  APP_NAME: 'FraudShield',
  APP_VERSION: '1.0.0',

  // Token storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: '@auth_access_token',
    REFRESH_TOKEN: '@auth_refresh_token',
    USER_DATA: '@auth_user_data',
  },

  // Request timeout in milliseconds
  REQUEST_TIMEOUT: 15000,
};

export default Config;
