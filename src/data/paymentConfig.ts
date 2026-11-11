/**
 * إعدادات الدفع والتواصل.
 * لتغيير أي رقم أو سعر عدّله هنا فقط، ثم أعد البناء والنشر.
 */
export const PAYMENT = {
  // عدد التقارير التي يضيفها كل كود
  packageSize: 100,

  // السعر الظاهر للمستخدم
  priceText: '500 جنيه مصري، أو ما يعادلها من أي عملة',

  // واتساب (الصيغة الدولية بدون + وبدون أصفار)
  whatsappIntl: '201005636746',
  whatsappDisplay: '+20 100 563 6746',

  // المحفظة الإلكترونية
  wallet: {
    name: 'فودافون كاش',
    number: '01005636746',
  },

  // رابط إنستاباي
  instapayUrl: 'https://ipn.eg/S/islam.ahmmad/instapay/6WpSIx',
};

// رقم حسابك (UID) في Firebase: وحده يرى صفحة إنشاء الأكواد
export const ADMIN_UID = '7Mdy4ctJVQe1SDjWF8xPdLgyiPj2';
