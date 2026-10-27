// scripts/testCall.js - Twilio Test Call Runner
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
const toNumber = process.argv[2] || '+919667651600';

console.log('----------------------------------------------------');
console.log('EnsureCare Twilio Outbound Voice Call Tester');
console.log('----------------------------------------------------');
console.log(`Account SID : ${accountSid || '(Missing)'}`);
console.log(`Auth Token  : ${authToken ? `${authToken.slice(0, 4)}...${authToken.slice(-4)}` : '(Missing)'}`);
console.log(`From Number : ${fromNumber || '(Missing)'}`);
console.log(`To Number   : ${toNumber}`);
console.log('----------------------------------------------------');

if (!accountSid || accountSid.includes('your_twilio') || !authToken || !fromNumber || fromNumber.includes('your_twilio')) {
  console.error('\n⚠️ Cannot place call: Missing Twilio Account SID or Twilio Phone Number in .env');
  console.log('Twilio API requires:');
  console.log('1. TWILIO_ACCOUNT_SID (starts with AC...)');
  console.log('2. TWILIO_AUTH_TOKEN  (already set!)');
  console.log('3. TWILIO_PHONE_NUMBER (your Twilio number, e.g. +1...)');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

const twiml = `
<Response>
  <Say>Hello! This is EnsureCare Healthcare Follow-Up Coordination Platform calling your number. Your Twilio Voice integration is working properly. Goodbye.</Say>
</Response>`.trim();

const customTwiml = `
<Response>
  <Pause length="1"/>
  <Say voice="alice" language="en-IN">
    Hello! This is EnsureCare Healthcare Follow-Up Coordination Platform. Your test appointment and medical follow-up are successfully confirmed. Our care coordination desk is ready for your visit. Thank you and stay healthy.
  </Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-IN">Goodbye.</Say>
</Response>`.trim();

const echoUrl = `https://twimlets.com/echo?Twiml=${encodeURIComponent(customTwiml)}`;

console.log('\nPlacing real outbound call via Twilio with custom voice URL...');

client.calls
  .create({
    url: echoUrl,
    to: toNumber,
    from: fromNumber
  })
  .then(call => {
    console.log('✅ Call successfully placed!');
    console.log(`Call SID   : ${call.sid}`);
    console.log(`Status     : ${call.status}`);
    console.log(`Direction  : ${call.direction}`);
    console.log(`Date       : ${call.dateCreated}`);
  })
  .catch(err => {
    console.error('❌ Twilio Call Failed:', err.message);
    console.error('Code:', err.code, 'Status:', err.status, 'More Info:', err.moreInfo);
    if (err.code === 21211) {
      console.error('Invalid "To" phone number format.');
    } else if (err.code === 21608) {
      console.error('Unverified number on Twilio Trial account. Please verify this phone number in your Twilio Console: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }
  });

