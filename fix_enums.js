const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = {
  // We'll use regex word boundaries to avoid partial matches
  // ProfileStatus
  "'INCOMPLETE'": "'draft'",
  "'COMPLETE'": "'published'", 
  "'SUBMITTED'": "'submitted'",
  "'UNDER_REVIEW'": "'under_review'",
  "'APPROVED'": "'approved'",
  "'REJECTED'": "'edit_rejected'",
  
  // VerificationStatus
  "'UNVERIFIED'": "'not_started'",
  "'PENDING'": "'pending'", // Will map to RequestStatus "pending". If used for Verification, we'll fix it manually to "pending_review".
  "'VERIFIED'": "'approved'",
  "'SUSPENDED'": "'suspended'", // Will map to AccountStatus "suspended". If for Verification, fix manually to "resubmit_required".
  
  // AccountStatus
  "'ACTIVE'": "'active'",
  "'DEACTIVATED'": "'deactivated'",
  "'DELETED'": "'deleted'",
  
  // TrustLevel
  "'BRONZE'": "'new'",
  "'SILVER'": "'building'",
  "'GOLD'": "'trusted'",
  "'PLATINUM'": "'highly_trusted'",

  // RequestStatus
  "'ACCEPTED'": "'accepted'",
  "'DECLINED'": "'declined'",
  "'EXPIRED'": "'expired'",
  "'COUNTER_PROPOSED'": "'counter_proposed'",

  // SessionStatus
  "'UPCOMING'": "'upcoming'",
  "'PRE_ARRIVAL'": "'pre_arrival'",
  "'CHECKED_IN'": "'checked_in'",
  "'EXTENDING'": "'extending'",
  "'COMPLETED'": "'completed'",
  "'CANCELLED'": "'cancelled'",
  "'NO_SHOW'": "'no_show'",
  "'DISPUTED'": "'disputed'",

  // TransactionType
  "'SESSION_EARNING'": "'session_earning'",
  "'EXTENSION_EARNING'": "'extension_earning'",
  "'SAFETY_BONUS'": "'safety_bonus'",
  "'REFERRAL_BONUS'": "'platform_fee'", 
  "'ADJUSTMENT'": "'platform_fee'",
  "'DEDUCTION'": "'cancellation_penalty'",
  "'PAYOUT_TRANSFER'": "'payout_transfer'",

  // TransactionStatus
  "'PENDING_REVIEW'": "'pending_review'",
  "'PAYOUT_ELIGIBLE'": "'payout_eligible'",
  "'DEDUCTED'": "'deducted'",
  "'ON_HOLD'": "'on_hold'",
  "'REFUNDED'": "'paid'", 

  // PayoutStatus
  "'REQUESTED'": "'requested'",
  "'PROCESSING'": "'processing'",
  "'FAILED'": "'failed'",
  
  // Category
  "'CAFE_CONVERSATION'": "'cafe_conversation'",
  "'CITY_WALK'": "'city_walk'",
  "'MUSEUM_TOUR'": "'art_culture'",
  "'EVENT_PLUS_ONE'": "'events'",
  "'SHOPPING_COMPANION'": "'shopping_assistance'",
  "'AIRPORT_COMPANION'": "'business_networking'",
  "'OUTDOOR_ACTIVITY'": "'wellness_walk'",
  "'GAMING_BUDDY'": "'events'",
  "'FITNESS_PARTNER'": "'wellness_walk'",
  "'MOVIE_BUDDY'": "'movies'",

  // NotificationType
  "'NEW_REQUEST'": "'request'",
  "'REQUEST_CANCELLED'": "'request'",
  "'SESSION_REMINDER'": "'session'",
  "'SESSION_STARTED'": "'session'",
  "'SESSION_COMPLETED'": "'session'",
  "'EARNINGS_CREDITED'": "'payout'",
  "'PAYOUT_PROCESSED'": "'payout'",
  "'KYC_UPDATE'": "'policy'",
  "'TRUST_SCORE_UPDATE'": "'policy'",
  "'SAFETY_ALERT'": "'safety'",
  "'SYSTEM_MESSAGE'": "'system'",
  "'PROMOTION'": "'system'",
};

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(srcDir);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const [key, val] of Object.entries(replacements)) {
    // Also replace double quotes
    const doubleQuoteKey = '"' + key.slice(1, -1) + '"';
    const doubleQuoteVal = '"' + val.slice(1, -1) + '"';
    content = content.split(key).join(val);
    content = content.split(doubleQuoteKey).join(doubleQuoteVal);
  }
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
