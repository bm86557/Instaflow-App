/**
 * Webhook Debug Test Script
 * Run this to check if webhooks are working
 */

console.log('🔍 Testing InstaFlow Webhook Configuration\n');

// Test 1: Check if Vercel deployment is reachable
console.log('Test 1: Checking Vercel deployment...');
fetch('https://instaflow-app-cyan.vercel.app/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=instaflow_webhook_token_123&hub.challenge=test123')
  .then(res => res.text())
  .then(text => {
    if (text === 'test123') {
      console.log('✅ Webhook verification endpoint works!\n');
    } else {
      console.log('❌ Unexpected response:', text, '\n');
    }
  })
  .catch(err => {
    console.log('❌ Error:', err.message, '\n');
  });

// Test 2: Check environment variables
console.log('Test 2: Environment Variables');
console.log('- WEBHOOK_VERIFY_TOKEN:', process.env.WEBHOOK_VERIFY_TOKEN || '❌ Missing');
console.log('- FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID || '❌ Missing');
console.log('- FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? '✅ Set' : '❌ Missing');
console.log('');

// Test 3: Instructions for manual webhook test
console.log('Test 3: Manual Webhook Test');
console.log('1. Go to: https://developers.facebook.com/apps/1759156038575585/webhooks/');
console.log('2. Find "comments" field');
console.log('3. Click "Test" button next to it');
console.log('4. Check Vercel logs at: https://vercel.com/bilal-maliks-projects-10/instaflow-app/logs');
console.log('5. You should see: [Webhook] Notification received');
console.log('');

console.log('Test 4: Comment on Instagram post');
console.log('1. Comment "price" on your Instagram post');
console.log('2. Wait 5-10 seconds');
console.log('3. Check Vercel logs for:');
console.log('   - [Webhook] Notification received');
console.log('   - [AutoReply] Processing comment');
console.log('   - [AutoReply] Matched rule');
console.log('   - [AutoReply] ✅ Reply sent successfully');
console.log('');
