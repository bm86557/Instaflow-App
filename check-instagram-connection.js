/**
 * Check Instagram Connection and Webhook Subscription
 * Run: node check-instagram-connection.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

async function checkWebhookSubscriptions() {
  console.log('\n🔍 Checking Webhook Subscriptions...\n');
  
  try {
    // Get app access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v19.0/oauth/access_token`,
      {
        params: {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          grant_type: 'client_credentials'
        }
      }
    );
    
    const appAccessToken = tokenResponse.data.access_token;
    console.log('✅ Got app access token');
    
    // Check webhook subscriptions
    const subscriptionsResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${FACEBOOK_APP_ID}/subscriptions`,
      {
        params: {
          access_token: appAccessToken
        }
      }
    );
    
    console.log('\n📋 Webhook Subscriptions:');
    console.log(JSON.stringify(subscriptionsResponse.data, null, 2));
    
    const instagramSub = subscriptionsResponse.data.data?.find(
      sub => sub.object === 'instagram'
    );
    
    if (!instagramSub) {
      console.log('\n❌ No Instagram webhook subscription found!');
      console.log('\n💡 Fix: Go to Meta Developer Console → Webhooks → Subscribe to Instagram');
    } else {
      console.log('\n✅ Instagram webhook subscription found:');
      console.log('   - Callback URL:', instagramSub.callback_url);
      console.log('   - Active:', instagramSub.active);
      
      const fieldNames = instagramSub.fields?.map(f => f.name) || [];
      console.log('   - Fields:', fieldNames.join(', ') || 'None');
      
      if (!fieldNames.includes('comments')) {
        console.log('\n❌ "comments" field NOT subscribed!');
        console.log('\n💡 Fix: Go to Meta Developer Console → Webhooks → Subscribe to "comments" field');
      } else {
        console.log('\n✅ "comments" field is subscribed');
        console.log('\n🤔 Webhook is configured correctly but not receiving events...');
        console.log('\n💡 Possible causes:');
        console.log('   1. Instagram account not properly linked to the Meta App');
        console.log('   2. Commenting on wrong Instagram account');
        console.log('   3. Need to re-link Instagram Business account');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error checking subscriptions:', error.response?.data || error.message);
  }
}

async function testWebhookEndpoint() {
  console.log('\n🔍 Testing Webhook Endpoint...\n');
  
  try {
    const response = await axios.get(
      'https://instaflow-app-cyan.vercel.app/api/webhooks/instagram',
      {
        params: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'instaflow_webhook_token_123',
          'hub.challenge': 'TEST_CHALLENGE_123'
        }
      }
    );
    
    if (response.data === 'TEST_CHALLENGE_123') {
      console.log('✅ Webhook endpoint is working correctly!');
    } else {
      console.log('❌ Unexpected response:', response.data);
    }
  } catch (error) {
    console.error('❌ Webhook endpoint test failed:', error.message);
  }
}

// Run checks
(async () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Instagram Webhook Connection Diagnostic Tool          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  await testWebhookEndpoint();
  await checkWebhookSubscriptions();
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
})();
