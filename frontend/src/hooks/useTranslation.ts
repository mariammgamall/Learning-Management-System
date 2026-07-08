import { create } from 'zustand';

interface TranslationState {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
  t: (key: string) => string;
}

const translations: Record<'en' | 'ar', Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    courses: 'My Courses',
    catalog: 'Course Catalog',
    profile: 'Profile Settings',
    meetings: 'Online Meetings',
    ta_quizzes: 'Quizzes Builder',
    logout: 'Log Out',
    welcome: 'Welcome back',
    streak: 'Daily Streak',
    xp: 'Experience Points',
    progress: 'Overall Progress',
    recent_activity: 'Recent Activity',
    view_details: 'View Details',
    language: 'Language',
    search: 'Search (Ctrl+K)...',
    chatbot: 'AI Assistant',
    sandbox: 'Coding Sandbox',
    certificate: 'View Certificate',
    
    // Additional Navigation translation labels
    ta_lectures: 'Lectures Auxiliary',
    doctor_courses: 'My Courses',
    doctor_lectures: 'Course Lectures',
    doctor_assignments: 'Assignments Manager',
    doctor_quizzes: 'Quizzes Builder',
    admin_users: 'Manage Users',
    admin_courses: 'Manage Courses',

    // Dashboard content labels
    excel_academics: 'Excel In Your Academics',
    student_hub: 'Student Hub',
    hero_description: 'Track your lectures progress, submit assignments on time, and challenge yourself with course quizzes.',
    enrolled_courses: 'Enrolled Courses',
    pending_assignments: 'Pending Assignments',
    avg_assignment_score: 'Avg Assignment Score',
    avg_quiz_score: 'Avg Quiz Score',
    quizzes_taken: 'Quizzes Taken',
    my_enrolled_courses: 'My Enrolled Courses',
    discover_catalog: 'Discover Catalog',
    lectures: 'Lectures',
    enter_portal: 'Enter Portal',
    gamification_hub: 'Gamification Hub',
    level: 'Level',
    day_streak: 'Day Streak',
    streak_active: 'Study streak active!',
    xp_to_next: 'XP to Level 4',
    xp_level_progress: 'XP Level Progress',
    achievements_locker: 'Achievements Locker',
    perfect_attend: 'Perfect Attend',
    perfect_attend_desc: 'Checked in 100% present',
    quiz_champion: 'Quiz Champion',
    quiz_champion_desc: 'Aced midterm exam prep',
    fast_graduate: 'Fast Graduate',
    fast_graduate_desc: 'Watched 100% lectures',
    code_cadet: 'Code Cadet',
    code_cadet_desc: 'Executed sandbox scripts',
    course_syllabus_progress: 'Course Syllabus Progress',
    lecture_completion: 'Lecture Completion',
    you_watched_pre: 'You watched ',
    you_watched_post: ' of uploaded lecture resources.',

    // Login page keys
    login_title: 'Sign in to your learning dashboard',
    email_address: 'Email Address',
    password: 'Password',
    sign_in: 'Sign In',

    // Profile page keys
    profile_title: 'Profile Settings',
    profile_subtitle: 'Manage your personal account credentials, change your profile photo, or modify registered email records.',
    full_name: 'Full Name',
    account_role: 'Account Role',
    upload_photo: 'Upload New Photo',
    delete_photo: 'Delete Photo',
    save_changes: 'Save Settings Changes',

    // Meetings page keys
    meetings_title: 'Online Meetings',
    meetings_subtitle: 'Join live sessions or watch past class recordings',
    active_meetings: 'Active Live Meetings',
    past_recordings: 'Past Recorded Meetings',
    join_room: 'Join Room',
    download_recording: 'Download Recording',

    // Catalog page keys
    catalog_title: 'Course Catalog',
    catalog_subtitle: 'Explore new paid and free courses below.',
    buy_enroll: 'Buy and Enroll',
    enroll_free: 'Enroll Free',

    // Enrolled Courses page keys
    enrolled_courses_title: 'My Enrolled Courses',
    enrolled_courses_subtitle: 'Access your active learning curriculum, view lectures, and upload homework assignments.',
    no_courses: 'You are not enrolled in any courses yet.',
    browse_catalog: 'Browse Course Catalog',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    courses: 'مقرراتي الدراسية',
    catalog: 'دليل المقررات',
    profile: 'إعدادات الملف الشخصي',
    meetings: 'الاجتماعات عبر الإنترنت',
    ta_quizzes: 'منشئ الاختبارات',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً بك مجدداً',
    streak: 'النشاط اليومي المتتالي',
    xp: 'نقاط الخبرة',
    progress: 'التقدم العام',
    recent_activity: 'النشاط الأخير',
    view_details: 'عرض التفاصيل',
    language: 'اللغة',
    search: 'البحث (Ctrl+K)...',
    chatbot: 'المساعد الذكي',
    sandbox: 'بيئة تشغيل البرمجة',
    certificate: 'عرض الشهادة الرسمية',
    
    // Additional Navigation translation labels
    ta_lectures: 'مساعد المحاضرات',
    doctor_courses: 'مقرراتي التدريسية',
    doctor_lectures: 'محاضرات المقرر',
    doctor_assignments: 'مدير التكليفات',
    doctor_quizzes: 'منشئ الاختبارات',
    admin_users: 'إدارة المستخدمين',
    admin_courses: 'إدارة المقررات الدراسية',

    // Dashboard content labels
    excel_academics: 'تميز في دراستك الأكاديمية',
    student_hub: 'منصة الطالب',
    hero_description: 'تابع تقدمك في المحاضرات، وسلم التكليفات في وقتها المحدد، وتحدَّ نفسك باختبارات المقررات.',
    enrolled_courses: 'المقررات المسجلة',
    pending_assignments: 'التكليفات المعلقة',
    avg_assignment_score: 'متوسط درجات التكليفات',
    avg_quiz_score: 'متوسط درجات الاختبارات',
    quizzes_taken: 'الاختبارات المنجزة',
    my_enrolled_courses: 'مقرراتي الدراسية المسجلة',
    discover_catalog: 'اكتشف دليل المواد',
    lectures: 'محاضرات',
    enter_portal: 'دخول المنصة',
    gamification_hub: 'مركز التفاعل والتحفيز',
    level: 'المستوى',
    day_streak: 'أيام متتالية',
    streak_active: 'سلسلة الدراسة نشطة!',
    xp_to_next: 'نقطة خبرة للمستوى 4',
    xp_level_progress: 'مؤشر نقاط الخبرة',
    achievements_locker: 'خزانة الإنجازات والأوسمة',
    perfect_attend: 'حضور كامل',
    perfect_attend_desc: 'حاضر بنسبة 100% في المحاضرات',
    quiz_champion: 'بطل الاختبارات',
    quiz_champion_desc: 'درجة كاملة في الاختبار التجريبي',
    fast_graduate: 'الخريج السريع',
    fast_graduate_desc: 'شاهدت 100% من المحاضرات',
    code_cadet: 'مبرمج واعد',
    code_cadet_desc: 'شغلت أكواداً في البيئة التجريبية',
    course_syllabus_progress: 'تقدم المنهج الدراسي',
    lecture_completion: 'إكمال المحاضرات',
    you_watched_pre: 'لقد شاهدت ',
    you_watched_post: ' من إجمالي المواد التعليمية المرفوعة.',

    // Login page keys
    login_title: 'تسجيل الدخول إلى منصتك التعليمية',
    email_address: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    sign_in: 'تسجيل الدخول',

    // Profile page keys
    profile_title: 'إعدادات الملف الشخصي',
    profile_subtitle: 'إدارة بيانات حسابك الشخصي، تغيير صورتك الشخصية، أو تعديل بريدك الإلكتروني المعتمد.',
    full_name: 'الاسم الكامل',
    account_role: 'دور الحساب',
    upload_photo: 'رفع صورة جديدة',
    delete_photo: 'حذف الصورة',
    save_changes: 'حفظ التعديلات',

    // Meetings page keys
    meetings_title: 'الاجتماعات عبر الإنترنت',
    meetings_subtitle: 'انضم إلى الجلسات التعليمية الحية أو شاهد المحاضرات المسجلة',
    active_meetings: 'الاجتماعات النشطة الآن',
    past_recordings: 'المحاضرات والتسجيلات السابقة',
    join_room: 'انضم الآن للغرفة',
    download_recording: 'تحميل التسجيل',

    // Catalog page keys
    catalog_title: 'دليل المقررات الدراسية',
    catalog_subtitle: 'استكشف المقررات الدراسية المجانية والمدفوعة المتاحة أدناه.',
    buy_enroll: 'شراء وتفعيل المقرر',
    enroll_free: 'التسجيل مجاناً',

    // Enrolled Courses page keys
    enrolled_courses_title: 'مقرراتي الدراسية المسجلة',
    enrolled_courses_subtitle: 'ادخل لمحتويات مناهجك الدراسية النشطة، شاهد المحاضرات، وارفع حلول التكليفات والواجبات.',
    no_courses: 'أنت غير مسجل في أي مقرر دراسي حالياً.',
    browse_catalog: 'تصفح دليل المواد',
  }
};

export const useTranslation = create<TranslationState>((set, get) => ({
  lang: 'en',
  setLang: (lang) => {
    set({ lang });
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  },
  t: (key) => {
    const { lang } = get();
    return translations[lang][key] || key;
  }
}));
