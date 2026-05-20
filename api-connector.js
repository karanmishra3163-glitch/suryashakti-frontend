// ============================================================
// api-connector.js — FRONTEND KO BACKEND SE JODTA HAI
//
// Yeh file kaise kaam karti hai?
// 1. User form fill karta hai
// 2. Yeh file Backend API ko call karti hai (fetch)
// 3. Backend data save karta hai + notifications bhejta hai
// 4. User ko success/error dikhata hai
//
// Kaise use karein:
// HTML file mein add karo: <script src="api-connector.js"></script>
// ============================================================

// Backend ka URL — development mein localhost, production mein real URL
const API_BASE_URL = 'https://suryashakti-backend-production.up.railway.app/api';
// Production mein: const API_BASE_URL = 'https://api.suryashakti.in/api';

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION: Form submit karo
// HTML mein: onclick="submitSolarEnquiry()"
// ─────────────────────────────────────────────────────────────
async function submitSolarEnquiry() {
  // Step 1: Form fields se data uthao
  const name    = document.getElementById('f_name')?.value.trim() || '';
  const phone   = document.getElementById('f_phone')?.value.trim() || '';
  const city    = document.getElementById('f_city')?.value.trim() || '';
  const service = document.getElementById('f_service')?.value || 'Solar Installation';
  const kw      = document.getElementById('f_kw')?.value.trim() || '';
  const msg     = document.getElementById('f_msg')?.value.trim() || '';

  // Step 2: Basic validation
  if (!name || !phone || !city) {
    showFormError('Please fill Name, Phone, and City.');
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    showFormError('Please enter a valid 10-digit Indian mobile number.');
    return;
  }

  // Step 3: Submit button disable karo (double submit rokne ke liye)
  setSubmitLoading(true);

  // Step 4: API ko data bhejo
  try {
    const response = await fetch(`${API_BASE_URL}/enquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer TOKEN' // agar auth chahiye
      },
      body: JSON.stringify({
        fullName:        name,
        phoneNumber:     phone,
        city:            city,
        serviceRequired: service,
        systemSize:      kw || null,
        message:         msg || null
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // SUCCESS: Enquiry save ho gayi
      showFormSuccess(result.data?.id);

      // WhatsApp pe bhi redirect karo (backup as always)
      const waText = buildWhatsAppMessage(name, phone, city, service, kw, msg, result.data?.id);
      setTimeout(() => {
        window.open(`https://wa.me/917834890440?text=${encodeURIComponent(waText)}`, '_blank');
      }, 1200);

      // Form clear karo
      clearForm();

    } else {
      // Server ne error diya
      showFormError(result.error || 'Something went wrong. Please try again.');

      // Fallback: directly WhatsApp pe redirect karo
      fallbackToWhatsApp(name, phone, city, service, kw, msg);
    }

  } catch (networkError) {
    // Network error (backend band hai, internet nahi, etc.)
    console.warn('Backend not reachable, falling back to WhatsApp:', networkError);

    // Fallback: WhatsApp pe redirect karo (data save nahi hoga par user stuck nahi hoga)
    fallbackToWhatsApp(name, phone, city, service, kw, msg);
    showFormSuccess(null, true); // true = fallback mode
  }

  setSubmitLoading(false);
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

// WhatsApp message banao
function buildWhatsAppMessage(name, phone, city, service, kw, msg, id = null) {
  return `🌟 *New Solar Service Request – SuryaShakti*

👤 *Name:* ${name}
📞 *Phone:* ${phone}
📍 *City:* ${city}
⚡ *Service:* ${service}
🔋 *System Size:* ${kw || 'Not specified'}
💬 *Message:* ${msg || 'No message'}
${id ? `🆔 *Enquiry ID:* #${id}` : ''}

_Sent from suryashakti.in_`;
}

// Fallback: Backend down ho to WhatsApp pe bhejo
function fallbackToWhatsApp(name, phone, city, service, kw, msg) {
  const text = buildWhatsAppMessage(name, phone, city, service, kw, msg);
  setTimeout(() => {
    window.open(`https://wa.me/917834890440?text=${encodeURIComponent(text)}`, '_blank');
  }, 600);
}

// Submit button loading state
function setSubmitLoading(loading) {
  const btn = document.querySelector('.btn-submit');
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Sending...';
    btn.style.opacity = '0.7';
  } else {
    btn.disabled = false;
    btn.innerHTML = '💬 Send via WhatsApp →';
    btn.style.opacity = '1';
  }
}

// Success message dikhao
function showFormSuccess(enquiryId, fallback = false) {
  const el = document.getElementById('formSuccess');
  if (!el) return;
  el.style.display = 'block';
  if (fallback) {
    el.innerHTML = `✅ Redirecting to WhatsApp... Our team will respond within 1-2 hours!`;
  } else {
    el.innerHTML = `✅ Enquiry #${enquiryId} submitted! Email + WhatsApp notification sent. We'll call you within 1-2 hours!`;
  }
  el.classList.add('show');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => el.classList.remove('show'), 8000);
}

// Error message dikhao
function showFormError(message) {
  const el = document.getElementById('formError');
  if (el) {
    el.textContent = '⚠️ ' + message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
    return;
  }
  alert(message);
}

// Form reset karo
function clearForm() {
  ['f_name','f_phone','f_city','f_kw','f_msg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}
