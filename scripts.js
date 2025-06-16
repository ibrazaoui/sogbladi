
        const manifest = {
            "name": "سوق بلادي",
            "short_name": "سوق بلادي",
            "start_url": "/",
            "display": "standalone",
            "background_color": "#2e7d32",
            "theme_color": "#2e7d32"
        };
        document.getElementById('app-manifest').href = URL.createObjectURL(
            new Blob([JSON.stringify(manifest)], { type: 'application/json' })
        );
    


        // تهيئة Supabase
        const supabaseUrl = 'https://nzyjlppvceyjbxzwxccw.supabase.co';
        // ⚠️ لا تضع المفتاح هنا في الإنتاج!
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eWpscHB2Y2V5amJ4end4Y2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNjI0NDAsImV4cCI6MjA2MjgzODQ0MH0.qFUu115Z-VascH7oC5Ec58EK-2FZnyZfgYPPNJ1HwN8';
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        // تعريف المتغيرات العامة
        let currentUser = null;
        let products = [];
        let notifications = [];
        let currentViewingImages = [];
        let currentImageIndex = 0;
        let otpEmail = '';
        let productToDelete = null;
        let lastSeenProductId = null;
        let notificationChannel = null;
        let hasShownWelcome = false;
        let sessionCheckInterval = null;

        // عناصر DOM
        const loginPage = document.getElementById('login-page');
        const otpPage = document.getElementById('otp-page');
        const registerPage = document.getElementById('register-page');
        const storePage = document.getElementById('store-page');
        const profilePage = document.getElementById('profile-page');
        const addProductPage = document.getElementById('add-product-page');
        const welcomeMessage = document.getElementById('welcome-message');
        const viewerMainImage = document.getElementById('viewer-main-image');
        const imageThumbnails = document.getElementById('image-thumbnails');
        const imageViewerModal = document.getElementById('image-viewer-modal');
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const forgotPasswordBtn = document.getElementById('forgot-password');
        const backToLoginBtn = document.getElementById('back-to-login');
        const backToLoginFromRegisterBtn = document.getElementById('back-to-login-from-register');
        const verifyOtpBtn = document.getElementById('verify-otp');
        const resendOtpBtn = document.getElementById('resend-otp');
        const completeRegisterBtn = document.getElementById('complete-register');
        const profileBtn = document.getElementById('profile-btn');
        const notificationsBtn = document.getElementById('notifications-btn');
        const notificationBadge = document.getElementById('notification-badge');
        const logoutBtn = document.getElementById('logout-btn');
        const backToStoreFromProfileBtn = document.getElementById('back-to-store-from-profile');
        const backToProfileBtn = document.getElementById('back-to-profile');
        const addProductBtn = document.getElementById('add-product');
        const cancelAddProductBtn = document.getElementById('cancel-add-product');
        const publishProductBtn = document.getElementById('publish-product');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const searchCategory = document.getElementById('search-category');
        const editProfileBtn = document.getElementById('edit-profile');
        const changeProfilePicBtn = document.getElementById('change-profile-pic');
        const closeViewerBtn = document.querySelector('.image-viewer-close');
        const prevImageBtn = document.getElementById('prev-image');
        const nextImageBtn = document.getElementById('next-image');
        const otpInputs = [
            document.getElementById('otp1'),
            document.getElementById('otp2'),
            document.getElementById('otp3'),
            document.getElementById('otp4'),
            document.getElementById('otp5'),
            document.getElementById('otp6')
        ];
        const deleteProductModal = document.getElementById('delete-product-modal');
        const logoutModal = document.getElementById('logout-modal');
        const editProfileModal = document.getElementById('edit-profile-modal');
        const changePicModal = document.getElementById('change-pic-modal');

        // تهيئة التطبيق
        document.addEventListener('DOMContentLoaded', initializeApp);
        
       


        async function initializeApp() {
            setupEventListeners();
            setupOTPInputs();
            setupAutoDeleteOldProducts();
            await checkAuthState();
            startSessionCheck();
            setupResetPasswordPage();
            
            if (window.location.hash.includes('#reset-password')) {
                await handlePasswordResetRedirect();
    }
}
        
        function setupEventListeners() {
            // أحداث المصادقة
            loginBtn.addEventListener('click', handleLogin);
            registerBtn.addEventListener('click', () => togglePages(loginPage, registerPage));
            backToLoginBtn.addEventListener('click', () => togglePages(otpPage, loginPage));
            backToLoginFromRegisterBtn.addEventListener('click', () => togglePages(registerPage, loginPage));
            verifyOtpBtn.addEventListener('click', handleVerifyOTP);
            resendOtpBtn.addEventListener('click', handleResendOTP);
            forgotPasswordBtn.addEventListener('click', handleForgotPassword);
            completeRegisterBtn.addEventListener('click', handleRegister);
            logoutBtn.addEventListener('click', () => showModal(logoutModal));
            document.getElementById('cancel-logout').addEventListener('click', () => hideModal(logoutModal));
            document.getElementById('confirm-logout').addEventListener('click', handleLogout);
            
            // أحداث التنقل
            profileBtn.addEventListener('click', showProfilePage);
            backToStoreFromProfileBtn.addEventListener('click', showStorePage);
            backToProfileBtn.addEventListener('click', () => togglePages(addProductPage, profilePage));
            
            // أحداث المنتجات
            addProductBtn.addEventListener('click', showAddProductPage);
            cancelAddProductBtn.addEventListener('click', cancelAddProduct);
            publishProductBtn.addEventListener('click', handlePublishProduct);
            document.getElementById('upload-images-btn').addEventListener('click', () => document.getElementById('product-image-input').click());
            document.getElementById('product-image-input').addEventListener('change', handleImageUpload);
            document.getElementById('cancel-delete-product').addEventListener('click', () => hideModal(deleteProductModal));
            document.getElementById('confirm-delete-product').addEventListener('click', handleDeleteProduct);
            
            // أحداث البحث
            searchBtn.addEventListener('click', handleSearch);
            searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());
            searchCategory.addEventListener('change', handleSearch);
            
            // أحداث الملف الشخصي
            editProfileBtn.addEventListener('click', setupEditProfileModal);
            document.getElementById('cancel-edit-profile').addEventListener('click', () => hideModal(editProfileModal));
            document.getElementById('save-profile').addEventListener('click', handleSaveProfile);
            changeProfilePicBtn.addEventListener('click', showChangePicModal);
            document.getElementById('cancel-change-pic').addEventListener('click', () => hideModal(changePicModal));
            document.getElementById('upload-profile-pic-btn').addEventListener('click', () => document.getElementById('new-profile-pic').click());
            document.getElementById('new-profile-pic').addEventListener('change', handleProfilePicUpload);
            document.getElementById('confirm-change-pic').addEventListener('click', handleConfirmChangePic);
            
            // أحداث الإشعارات
            notificationsBtn.addEventListener('click', toggleNotificationsPanel);
            document.addEventListener('click', handleOutsideNotificationsClick);
            
            // أحداث عرض الصور
            closeViewerBtn.addEventListener('click', () => hideModal(imageViewerModal));
            prevImageBtn.addEventListener('click', showPrevImage);
            nextImageBtn.addEventListener('click', showNextImage);
            
            // أحداث أخرى
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }
        
        function startSessionCheck() {
            sessionCheckInterval = setInterval(async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    clearInterval(sessionCheckInterval);
                    handleLogout();
                }
            }, 5 * 60 * 1000);
        }
        
        async function checkAuthState() {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error) throw error;
                
                if (session?.user) {
                    currentUser = session.user;
                    await loadUserData(session.user.id);
                    await loadProducts();
                    await loadNotifications();
                    setupRealtimeNotifications();
                    showStorePage();
                    
                    if (!hasShownWelcome) {
                        welcomeMessage.style.display = 'block';
                        hasShownWelcome = true;
                        setTimeout(() => {
                            welcomeMessage.style.display = 'none';
                        }, 5000);
                    }
                } else {
                    showLoginPage();
                }
                
                supabase.auth.onAuthStateChange(handleAuthStateChange);
                
            } catch (error) {
                console.error("خطأ في جلب حالة الجلسة:", error);
                showLoginPage();
            }
        }
        
        async function handleAuthStateChange(event, session) {
            if (event === 'SIGNED_IN' && session?.user) {
                try {
                    currentUser = session.user;
                    await loadUserData(session.user.id);
                    // إذا كان المستخدم قد سجل الدخول عبر فيسبوك، تأكد من تحديث ملفه الشخصي
                   /* if (session.provider_token) {
                    await updateUserProfileFromFacebook(session);
                          } */
                    await loadProducts();
                    await loadNotifications();
                    setupRealtimeNotifications();
                    showStorePage();
                    
                    if (!hasShownWelcome) {
                        welcomeMessage.style.display = 'block';
                        hasShownWelcome = true;
                        setTimeout(() => {
                            welcomeMessage.style.display = 'none';
                        }, 5000);
                    }
                } catch (error) {
                    console.error("خطأ في تحميل البيانات:", error);
                    showNotification("حدث خطأ أثناء تحميل البيانات", "error");
                }
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                hasShownWelcome = false;
                if (notificationChannel) {
                    supabase.removeChannel(notificationChannel);
                    notificationChannel = null;
                }
                clearInterval(sessionCheckInterval);
                showLoginPage();
            } else if (event === 'TOKEN_REFRESHED') {
                console.log("تم تجديد جلسة المستخدم");
            } else if (event === 'USER_UPDATED') {
                if (session?.user) {
                    await loadUserData(session.user.id);
                }
            }
        }
        
        function handleVisibilityChange() {
            if (document.visibilityState === 'visible' && currentUser) {
                loadNotifications();
            }
        }
        
        function validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        function validatePhone(phone) {
            return /^[0-9]{9}$/.test(phone);
        }

        function validatePassword(password) {
            return password.length >= 6;
        }
        
        async function handleLogin() {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            
            if (!validateEmail(email)) {
                showNotification("البريد الإلكتروني غير صحيح", "error");
                return;
            }
    
            if (!validatePassword(password)) {
                showNotification("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
                return;
            }
            
            try {
                toggleButtonLoading(loginBtn, true);
                
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
                    } else {
                        throw error;
                    }
                }
                
                if (data.user) {
                    await loadUserData(data.user.id);
                    await loadProducts();
                    await loadNotifications();
                    showStorePage();
                    showNotification("تم تسجيل الدخول بنجاح", "success");
                    
                    welcomeMessage.style.display = 'block';
                    setTimeout(() => {
                        welcomeMessage.style.display = 'none';
                    }, 5000);
                }
            } catch (error) {
                showNotification(error.message, "error");
            } finally {
                toggleButtonLoading(loginBtn, false);
            }
        }
        
       
            }
        });

        if (error) throw error;

        // هذه الخطوة غير ضرورية عادةً لأن supabase.auth.onAuthStateChange سيتعامل معها
        // ولكن يمكنك إضافتها للتحقق الفوري
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await loadUserData(session.user.id);
            await loadProducts();
            showStorePage();
            showNotification("تم تسجيل الدخول بنجاح عبر فيسبوك", "success");
        }

    } catch (error) {
        console.error("خطأ في تسجيل الدخول عبر فيسبوك:", error);
        let errorMessage = "حدث خطأ أثناء تسجيل الدخول عبر فيسبوك";
        
        if (error.message.includes("Popup closed")) {
            errorMessage = "تم إغلاق نافذة التسجيل. يرجى المحاولة مرة أخرى.";
        } else if (error.message.includes("User denied")) {
            errorMessage = "تم رفض الإذن لتسجيل الدخول عبر فيسبوك";
        }
        
        showNotification(errorMessage, "error");
    } finally {
        toggleButtonLoading(facebookLoginBtn, false);
    }
}
    */
        
         /* async function updateUserProfileFromFacebook(session) {
    try {
        // جلب معلومات المستخدم من فيسبوك
        const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${session.provider_token}`);
        const facebookData = await response.json();
        
        if (!facebookData.id) throw new Error("لا يمكن جلب بيانات فيسبوك");
        
        // تحديث الملف الشخصي في Supabase
        const updates = {
            updated_at: new Date().toISOString()
        };
        
        if (facebookData.name) updates.full_name = facebookData.name;
        if (facebookData.email) updates.email = facebookData.email;
        if (facebookData.picture?.data?.url) updates.profile_pic = facebookData.picture.data.url;
        
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id);
            
        if (error) throw error;
        
        // إعادة تحميل بيانات المستخدم
        await loadUserData(session.user.id);
        
    } catch (error) {
        console.error("خطأ في تحديث الملف الشخصي من فيسبوك:", error);
    }
} */
       
        async function handleRegister() {
            const fullName = document.getElementById('full-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const age = document.getElementById('age').value;
            const wilaya = document.getElementById('wilaya').value;
            const phone = document.getElementById('register-phone').value;
            
            if (!fullName || !email || !password || !confirmPassword || !age || !wilaya || !phone) {
                showNotification("الرجاء ملء جميع الحقول المطلوبة", "error");
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification("كلمة المرور وتأكيدها غير متطابقين", "error");
                return;
            }
            
            if (phone.length !== 9) {
                showNotification("رقم الهاتف يجب أن يتكون من 9 أرقام", "error");
                return;
            }
            
            try {
                toggleButtonLoading(completeRegisterBtn, true);
                
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName,
                            age: parseInt(age),
                            wilaya: wilaya,
                            phone: `+213${phone}`
                        }
                    }
                });

                if (error) throw error;
                
                otpEmail = email;
                togglePages(registerPage, otpPage);
                showNotification("تم إرسال كود التحقق إلى بريدك الإلكتروني", "success");

            } catch (error) {
                console.error("خطأ في التسجيل:", error);
                showNotification("خطأ في التسجيل: " + error.message, "error");
            } finally {
                toggleButtonLoading(completeRegisterBtn, false);
            }
        }
        
        async function handleVerifyOTP() {
            const otpCode = otpInputs.map(input => input.value).join('');
            
            if (otpCode.length !== 6) {
                showNotification("الرجاء إدخال كود التحقق المكون من 6 أرقام", "error");
                return;
            }
            
            try {
                toggleButtonLoading(verifyOtpBtn, true);
                
                const { data, error } = await supabase.auth.verifyOtp({
                    email: otpEmail,
                    token: otpCode,
                    type: 'email'
                });

                if (error) throw error;
                
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError || !session) {
                    throw sessionError || new Error("لا توجد جلسة نشطة");
                }
                
                await loadUserData(session.user.id);
                await loadProducts();
                showStorePage();
                showNotification("تم التحقق بنجاح", "success");
                
                welcomeMessage.style.display = 'block';
                setTimeout(() => {
                    welcomeMessage.style.display = 'none';
                }, 5000);
                
            } catch (error) {
                console.error("خطأ في التحقق:", error);
                showNotification("كود التحقق غير صحيح أو انتهت صلاحيته: " + error.message, "error");
            } finally {
                toggleButtonLoading(verifyOtpBtn, false);
            }
        }
        
        async function handleResendOTP() {
            try {
                toggleButtonLoading(resendOtpBtn, true);
                
                const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email: otpEmail
                });
                
                if (error) throw error;
                
                showNotification("تم إعادة إرسال كود التحقق إلى بريدك الإلكتروني", "success");
            } catch (error) {
                console.error("خطأ في إعادة إرسال كود التحقق:", error);
                showNotification("خطأ في إعادة إرسال كود التحقق: " + error.message, "error");
            } finally {
                toggleButtonLoading(resendOtpBtn, false);
            }
        }
        
        async function handleForgotPassword() {
    const email = document.getElementById('login-email').value.trim();
    
    if (!validateEmail(email)) {
        showNotification("البريد الإلكتروني غير صالح", "error");
        return;
    }

    try {
        toggleButtonLoading(forgotPasswordBtn, true);
        
        // تحقق من آخر وقت تم فيه إرسال طلب
        const lastSent = localStorage.getItem('lastPasswordResetSent');
        if (lastSent && (Date.now() - parseInt(lastSent)) < 60000) {
            showNotification("الرجاء الانتظار دقيقة قبل إعادة المحاولة", "error");
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname + '#reset-password'
        });

        if (error) throw error;
        
        localStorage.setItem('lastPasswordResetSent', Date.now());
        showNotification("تم إرسال رابط الاستعادة إلى بريدك (تحقق من صندوق spam)", "success");
    } catch (error) {
        console.error("Error sending reset link:", error);
        showNotification("فشل إرسال الرابط: " + error.message, "error");
    } finally {
        toggleButtonLoading(forgotPasswordBtn, false);
    }
}
        
        function setupResetPasswordPage() {
    if (window.location.hash === '#reset-password') {
        handlePasswordResetRedirect();
    }
    
    document.getElementById('cancel-reset-password').addEventListener('click', () => {
        window.location.hash = '';
        togglePages(document.getElementById('reset-password-page'), loginPage);
    });
    
    document.getElementById('submit-reset-password').addEventListener('click', handlePasswordReset);
}
        
        async function handlePasswordResetRedirect() {
    try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session?.access_token) {
            showNotification("رابط الاستعادة غير صالح أو منتهي الصلاحية", "error");
            window.location.hash = '';
            return;
        }
        
        // عرض واجهة إعادة التعيين
        togglePages(loginPage, document.getElementById('reset-password-page'));
    } catch (error) {
        showNotification("حدث خطأ أثناء معالجة الرابط", "error");
        window.location.hash = '';
    }
}
       
        async function handlePasswordReset() {
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (!newPassword || !confirmPassword) {
        showNotification("الرجاء تعبئة جميع الحقول", "error");
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification("كلمة المرور غير متطابقة", "error");
        return;
    }
    
    try {
        toggleButtonLoading(document.getElementById('submit-reset-password'), true);
        
        // تأكيد الجلسة أولاً
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        if (sessionError) throw sessionError;
        
        // تحديث كلمة المرور
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (updateError) throw updateError;
        
        showNotification("تم تحديث كلمة المرور بنجاح", "success");
        
        // إعادة التوجيه بعد 3 ثواني
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname + '#login';
        }, 3000);
        
    } catch (error) {
        console.error("Error resetting password:", error);
        showNotification("فشل التحديث: " + (error.message || "انتهت صلاحية الرابط"), "error");
    } finally {
        toggleButtonLoading(document.getElementById('submit-reset-password'), false);
    }
}
        
        async function handleLogout() {
            try {
                toggleButtonLoading(document.getElementById('confirm-logout'), true);
                
                if (notificationChannel) {
                    supabase.removeChannel(notificationChannel);
                    notificationChannel = null;
                }
                
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                
                hideModal(logoutModal);
                currentUser = null;
                hasShownWelcome = false;
                clearInterval(sessionCheckInterval);
                showLoginPage();
                showNotification("تم تسجيل الخروج بنجاح", "success");
            } catch (error) {
                console.error("خطأ في تسجيل الخروج:", error);
                showNotification("خطأ في تسجيل الخروج: " + error.message, "error");
            } finally {
                toggleButtonLoading(document.getElementById('confirm-logout'), false);
            }
        }
        
        async function loadUserData(userId) {
            try {
                const { data: userData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();
                
                if (error) throw error;
                
                if (userData) {
                    currentUser = {
                        ...userData,
                        liked_products: Array.isArray(userData.liked_products) ? 
                            userData.liked_products : []
                    };
                    updateProfilePage();
                } else {
                    const { data: authData } = await supabase.auth.getUser();
                    
                    if (authData.user) {
                        let fullName = authData.user.user_metadata?.full_name || 
                                      authData.user.user_metadata?.name || 
                                      'مستخدم جديد';
                        
                        let profilePic = authData.user.user_metadata?.avatar_url || '';
                        
                        const newProfile = {
                            id: authData.user.id,
                            full_name: fullName,
                            email: authData.user.email,
                            age: authData.user.user_metadata?.age || 18,
                            wilaya: authData.user.user_metadata?.wilaya || 'الجزائر',
                            phone: authData.user.user_metadata?.phone || '+213000000000',
                            profile_pic: profilePic,
                            liked_products: []
                        };

                        const { data: insertedProfile, error: insertError } = await supabase
                            .from('profiles')
                            .insert(newProfile)
                            .select()
                            .single();
                        
                        if (insertError) throw insertError;
                        
                        currentUser = insertedProfile;
                        updateProfilePage();
                    }
                }
            } catch (error) {
                console.error("خطأ في جلب بيانات المستخدم:", error);
                showNotification("خطأ في جلب بيانات المستخدم: " + (error.message || "حدث خطأ غير متوقع"), "error");
                
                currentUser = {
                    id: userId,
                    liked_products: [],
                    full_name: 'مستخدم',
                    email: '',
                    age: 18,
                    wilaya: 'الجزائر',
                    phone: '+213000000000',
                    profile_pic: ''
                };
            }
        }
        
        async function setupEditProfileModal() {
            if (!currentUser) return;
            
            document.getElementById('edit-full-name').value = currentUser.full_name;
            document.getElementById('edit-email').value = currentUser.email;
            document.getElementById('edit-age').value = currentUser.age;
            document.getElementById('edit-wilaya').value = currentUser.wilaya;
            document.getElementById('edit-phone').value = currentUser.phone.replace('+213', '');
            showModal(editProfileModal);
        }
        
        async function handleSaveProfile() {
            if (!currentUser) {
                showNotification("يجب تسجيل الدخول أولاً", "error");
                return;
            }

            const fullName = document.getElementById('edit-full-name').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const age = document.getElementById('edit-age').value;
            const wilaya = document.getElementById('edit-wilaya').value;
            const phone = document.getElementById('edit-phone').value;
            
            if (!fullName || !email || !age || !wilaya || !phone) {
                showNotification("الرجاء ملء جميع الحقول", "error");
                return;
            }
            
            try {
                toggleButtonLoading(document.getElementById('save-profile'), true);
                
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        email: email,
                        age: parseInt(age),
                        wilaya: wilaya,
                        phone: `+213${phone}`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', currentUser.id);
                
                if (error) throw error;
                
                currentUser.full_name = fullName;
                currentUser.email = email;
                currentUser.age = parseInt(age);
                currentUser.wilaya = wilaya;
                currentUser.phone = `+213${phone}`;
                
                updateProfilePage();
                hideModal(editProfileModal);
                showNotification("تم تحديث الملف الشخصي بنجاح", "success");
            } catch (error) {
                console.error("خطأ في تحديث الملف الشخصي:", error);
                showNotification("خطأ في تحديث الملف الشخصي: " + error.message, "error");
            } finally {
                toggleButtonLoading(document.getElementById('save-profile'), false);
            }
        }
        
        function updateProfilePage() {
            if (!currentUser) return;

            document.getElementById('profile-full-name').textContent = currentUser.full_name;
            document.getElementById('profile-email').textContent = currentUser.email;
            document.getElementById('profile-age').textContent = currentUser.age;
            document.getElementById('profile-wilaya').textContent = currentUser.wilaya;
            document.getElementById('profile-phone').textContent = currentUser.phone;

            updateProfilePicElements();
        }
        
        function updateProfilePicElements() {
            const profilePic = document.getElementById('profile-picture');
            const headerPic = document.getElementById('header-profile-pic');
            
            profilePic.innerHTML = '';
            headerPic.innerHTML = '';
            
            if (currentUser.profile_pic && currentUser.profile_pic.trim() !== '') {
                if (currentUser.profile_pic.startsWith('http')) {
                    createProfileImage(profilePic, currentUser.profile_pic);
                    createProfileImage(headerPic, currentUser.profile_pic);
                } else {
                    getSignedProfilePicUrl(currentUser.profile_pic).then(url => {
                        if (url) {
                            createProfileImage(profilePic, url);
                            createProfileImage(headerPic, url);
                        } else {
                            setInitialsFallback(profilePic, headerPic);
                        }
                    }).catch(() => {
                        setInitialsFallback(profilePic, headerPic);
                    });
                }
            } else {
                setInitialsFallback(profilePic, headerPic);
            }
        }
        
        function createProfileImage(element, url) {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'صورة الملف الشخصي';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            img.style.display = 'block';
            img.onerror = () => {
                element.innerHTML = '';
                setInitialsFallback(element);
            };
            element.appendChild(img);
        }
        
        function setInitialsFallback(...elements) {
            const initial = currentUser?.full_name?.charAt(0) || 'U';
            elements.forEach(el => {
                el.textContent = initial;
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.fontWeight = 'bold';
                el.style.fontSize = (el === document.getElementById('profile-picture') ? '40px' : '14px');
                el.style.color = '#666';
            });
        }
        
        async function getSignedProfilePicUrl(path) {
            try {
                const { data, error } = await supabase.storage
                    .from('profile-pictures')
                    .createSignedUrl(path, 3600);
                
                if (error) throw error;
                return data?.signedUrl;
            } catch (error) {
                console.error('فشل في توليد رابط الصورة:', error);
                return null;
            }
        }
        
        function showChangePicModal() {
            if (!currentUser) {
                showNotification("يجب تسجيل الدخول أولاً", "error");
                return;
            }
            document.getElementById('profile-pic-preview').innerHTML = '';
            document.getElementById('new-profile-pic').value = '';
            showModal(changePicModal);
        }
        
        function handleProfilePicUpload(e) {
            const preview = document.getElementById('profile-pic-preview');
            preview.innerHTML = '';
            const file = e.target.files[0];
            
            if (file) {
                if (!file.type.startsWith('image/')) {
                    showNotification("الرجاء اختيار ملف صورة", "error");
                    return;
                }
                
                if (file.size > 2 * 1024 * 1024) {
                    showNotification("حجم الصورة يجب أن يكون أقل من 2MB", "error");
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.classList.add('preview-image');
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        }
        
        async function handleConfirmChangePic() {
            const file = document.getElementById('new-profile-pic').files[0];
            if (!file || !currentUser) return;

            try {
                toggleButtonLoading(document.getElementById('confirm-change-pic'), true);
                
                const fileExt = file.name.split('.').pop();
                const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
                const filePath = fileName;

                const { error: uploadError } = await supabase.storage
                    .from('profile-pictures')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        contentType: file.type,
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                if (currentUser.profile_pic && !currentUser.profile_pic.startsWith('http')) {
                    await supabase.storage
                        .from('profile-pictures')
                        .remove([currentUser.profile_pic])
                        .catch(console.error);
                }

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ profile_pic: filePath })
                    .eq('id', currentUser.id);

                if (updateError) throw updateError;

                currentUser.profile_pic = filePath;
                updateProfilePicElements();
                hideModal(changePicModal);
                showNotification("تم تحديث صورة الملف الشخصي بنجاح", "success");

            } catch (error) {
                console.error("خطأ في تغيير صورة الملف الشخصي:", error);
                showNotification("خطأ في تغيير صورة الملف الشخصي: " + error.message, "error");
            } finally {
                toggleButtonLoading(document.getElementById('confirm-change-pic'), false);
            }
        }
        
        async function setupAutoDeleteOldProducts() {
            try {
                const twentyDaysAgo = new Date();
                twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
                
                const { data: oldProducts, error: fetchError } = await supabase
                    .from('products')
                    .select('id, image_paths')
                    .lt('created_at', twentyDaysAgo.toISOString());
                
                if (fetchError) throw fetchError;
                
                if (oldProducts?.length > 0) {
                    const imagePathsToDelete = oldProducts.flatMap(product => 
                        product.image_paths?.filter(path => path) || []
                    );
                    
                    if (imagePathsToDelete.length > 0) {
                        await supabase.storage
                            .from('product-images')
                            .remove(imagePathsToDelete)
                            .catch(console.error);
                    }
                    
                    const productIdsToDelete = oldProducts.map(p => p.id);
                    await supabase
                        .from('products')
                        .delete()
                        .in('id', productIdsToDelete)
                        .catch(console.error);
                    
                    console.log(`تم حذف ${oldProducts.length} منتج قديم تلقائياً`);
                }
            } catch (error) {
                console.error("خطأ في الحذف التلقائي للمنتجات القديمة:", error);
            }
        }
        
        async function loadProducts() {
            try {
                const { data: productsData, error } = await supabase
                    .from('products')
                    .select(`
                        id,
                        user_id,
                        name,
                        price,
                        category,
                        condition,
                        description,
                        phone,
                        image_paths,
                        created_at,
                        views,
                        likes
                    `)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) throw error;

                const productsWithImages = await Promise.all(
                    productsData.map(async product => ({
                        ...product,
                        signed_image_urls: await getSignedProductImageUrls(product.image_paths || [])
                    }))
                );

                products = productsWithImages;
                renderProducts();

                if (lastSeenProductId) {
                    lastSeenProductId = null;
                    await loadProducts();
                }
            } catch (error) {
                console.error("Error loading products:", error);
                showNotification("حدث خطأ في تحميل المنتجات", "error");
            }
        }
        
        async function getSignedProductImageUrls(imagePaths) {
            if (!imagePaths?.length) return [];
            
            const urls = [];
            for (const path of imagePaths) {
                try {
                    const cleanPath = path.startsWith('product-images/') ? path : `product-images/${path}`;
                    
                    const { data, error } = await supabase.storage
                        .from('product-images')
                        .createSignedUrl(cleanPath, 3600);
                    
                    if (!error && data?.signedUrl) {
                        urls.push(data.signedUrl);
                    }
                } catch (error) {
                    console.error('Failed to get image URL:', path, error);
                }
            }
            return urls.filter(url => url);
        }
        
        function renderProducts() {
            const container = document.getElementById('products-container');
            container.innerHTML = '';
            
            if (!products.length) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1;">
                        <div>📭</div>
                        <h3>لا توجد منتجات متاحة حالياً</h3>
                        <p>كن أول من ينشر منتج في المتجر</p>
                    </div>
                `;
                return;
            }
            
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.setAttribute('role', 'listitem');
                
                const isLiked = currentUser?.liked_products?.includes(product.id) || false;
                const isOwner = currentUser && product.user_id === currentUser.id;
                const imageUrl = product.signed_image_urls?.[0] || null;
                
                productCard.innerHTML = `
                    <div class="product-image-container" tabindex="0" aria-label="صورة المنتج ${product.name}">
                        ${imageUrl ? 
                            `<img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy">` :
                            '<div style="font-size: 48px;">📷</div>'}
                    </div>
                    <div class="product-info">
                        <div class="product-detail">
                            <span class="detail-label">إسم المنتج:</span>
                            <span>${escapeHtml(product.name)}</span>
                        </div>
                        <div class="product-detail">
                            <span class="detail-label">سعر المنتج:</span>
                            <span class="product-price">${product.price.toLocaleString()} دج</span>
                        </div>
                        <div class="product-detail">
                            <span class="detail-label">حالة المنتج:</span>
                            <span>${escapeHtml(product.condition)}</span>
                        </div>
                        <div class="product-detail">
                            <span class="detail-label">نوع المنتج:</span>
                            <span>${escapeHtml(product.category)}</span>
                        </div>
                        <div class="product-detail">
                            <span class="detail-label">رقم الهاتف:</span>
                            <span class="product-phone">${escapeHtml(product.phone)}</span>
                        </div>
                        <div class="product-actions">
                            <button class="like-btn ${isLiked ? 'liked' : ''}" 
                                    data-product-id="${product.id}" 
                                    aria-label="${isLiked ? 'إزالة الإعجاب' : 'إعجاب'}">
                                <span>${isLiked ? '❤️' : '🤍'}</span>
                                <span>${product.likes || 0}</span>
                            </button>
                            <div class="views-count" aria-label="عدد المشاهدات">
                                <span>👁️</span>
                                <span>${product.views || 0}</span>
                            </div>
                        </div>
                        ${isOwner ? 
                            `<button class="delete-product-btn" 
                                     data-product-id="${product.id}"
                                     aria-label="حذف المنتج">
                                حذف المنتج
                            </button>` : ''}
                    </div>
                `;
                
                const productImage = productCard.querySelector('.product-image-container');
                productImage.addEventListener('click', async () => {
                    if (product.signed_image_urls?.length) {
                        lastSeenProductId = product.id;
                        if (!isOwner) {
                            await increaseProductViews(product.id);
                        }
                        openImageViewer(product.signed_image_urls);
                    }
                });
                
                const likeBtn = productCard.querySelector('.like-btn');
                likeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await handleLikeProduct(product.id, likeBtn);
                });
                
                if (isOwner) {
                    const deleteBtn = productCard.querySelector('.delete-product-btn');
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        productToDelete = product.id;
                        showModal(deleteProductModal);
                    });
                }
                
                container.appendChild(productCard);
            });
        }
        
        async function handleLikeProduct(productId, likeBtn) {
            if (!currentUser) {
                showNotification("يجب تسجيل الدخول للإعجاب بالمنتجات", "error");
                return;
            }

            try {
                const product = products.find(p => p.id === productId);
                if (!product) return;

                const isLiked = likeBtn.classList.contains('liked');
                const likeCountSpan = likeBtn.querySelector('span:last-child');
                let likeCount = parseInt(likeCountSpan.textContent) || 0;

                if (isLiked) {
                    const { error: productError } = await supabase
                        .from('products')
                        .update({ 
                            likes: Math.max((product.likes || 0) - 1, 0),
                            updated_at: new Date().toISOString() 
                        })
                        .eq('id', productId);

                    if (productError) throw productError;

                    const updatedLikes = currentUser.liked_products.filter(id => id !== productId);

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ 
                            liked_products: updatedLikes,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentUser.id);

                    if (profileError) throw profileError;

                    likeBtn.classList.remove('liked');
                    likeBtn.innerHTML = `<span>🤍</span><span>${Math.max(likeCount - 1, 0)}</span>`;
                    currentUser.liked_products = updatedLikes;
                    product.likes = Math.max(likeCount - 1, 0);

                } else {
                    const { error: productError } = await supabase
                        .from('products')
                        .update({ 
                            likes: (product.likes || 0) + 1,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', productId);

                    if (productError) throw productError;

                    const newLikes = [...currentUser.liked_products, productId];

                    const { error: profileError } = await supabase
                        .from('profiles')
                        .update({ 
                            liked_products: newLikes,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentUser.id);

                    if (profileError) throw profileError;

                    likeBtn.classList.add('liked');
                    likeBtn.innerHTML = `<span>❤️</span><span>${likeCount + 1}</span>`;
                    currentUser.liked_products = newLikes;
                    product.likes = likeCount + 1;

                    if (product.user_id !== currentUser.id) {
                        await sendLikeNotification(product);
                    }
                }
            } catch (error) {
                console.error("خطأ في تحديث الإعجاب:", error);
                showNotification("حدث خطأ أثناء تحديث الإعجاب", "error");
                await loadUserData(currentUser.id);
                await loadProducts();
            }
        }
        
        async function sendLikeNotification(product) {
            try {
                const message = `❤️ ${currentUser.full_name || 'مستخدم'} أعجب بمنتجك "${product.name}"`;
                
                const { error } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: product.user_id,
                        message: message,
                        related_product_id: product.id,
                        is_read: false,
                        created_at: new Date().toISOString()
                    });

                if (!error) {
                    playNotificationSound();
                    showBrowserNotification("إعجاب جديد", message);
                }
            } catch (error) {
                console.error('فشل إرسال الإشعار:', error);
            }
        }
        
        async function increaseProductViews(productId) {
            try {
                const { error } = await supabase.rpc('increment_views', {
                    product_id: productId
                });
                
                if (error) throw error;
                
                const productIndex = products.findIndex(p => p.id === productId);
                if (productIndex !== -1) {
                    products[productIndex].views = (products[productIndex].views || 0) + 1;
                    const productCard = document.querySelector(`.product-card [data-product-id="${productId}"]`);
                    if (productCard) {
                        const viewsCount = productCard.querySelector('.views-count span:last-child');
                        if (viewsCount) {
                            viewsCount.textContent = products[productIndex].views;
                        }
                    }
                }
            } catch (error) {
                console.error("خطأ في زيادة المشاهدات:", error);
            }
        }
        
        async function handleSearch() {
            const searchTerm = searchInput.value.trim();
            const category = searchCategory.value;
            
            try {
                let query = supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (searchTerm) {
                    const arabicSearchTerm = convertFrenchToArabic(searchTerm);
                    query = query.or(`name.ilike.%${arabicSearchTerm}%,description.ilike.%${arabicSearchTerm}%`);
                }
                
                if (category) {
                    query = query.eq('category', category);
                }
                
                const { data: productsData, error } = await query;
                
                if (error) throw error;
                
                products = await Promise.all(
                    productsData.map(async product => ({
                        ...product,
                        signed_image_urls: await getSignedProductImageUrls(product.image_paths || [])
                    }))
                );
                
                renderProducts();
            } catch (error) {
                console.error("خطأ في البحث:", error);
                showNotification("خطأ في البحث: " + error.message, "error");
            }
        }
        
        function showAddProductPage() {
            togglePages(profilePage, addProductPage);
            if (currentUser) {
                document.getElementById('product-phone').value = currentUser.phone.replace('+213', '');
            }
        }
        
        function cancelAddProduct() {
            togglePages(addProductPage, profilePage);
            resetProductForm();
        }
        
        function resetProductForm() {
            document.getElementById('product-name').value = '';
            document.getElementById('product-price').value = '';
            document.getElementById('product-category').value = '';
            document.getElementById('product-condition').value = '';
            document.getElementById('product-description').value = '';
            document.getElementById('product-phone').value = '';
            document.getElementById('product-image-input').value = '';
            document.getElementById('image-preview').innerHTML = '';
        }
        
        function handleImageUpload(e) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = '';
            const files = Array.from(e.target.files).slice(0, 4);
            
            if (files.length === 0) return;
            
            files.forEach((file, index) => {
                if (!file.type.startsWith('image/')) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgContainer = document.createElement('div');
                    imgContainer.style.position = 'relative';
                    imgContainer.style.display = 'inline-block';
                    
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.classList.add('preview-image');
                    img.style.width = '80px';
                    img.style.height = '80px';
                    img.style.objectFit = 'cover';
                    img.style.margin = '5px';
                    
                    const removeBtn = document.createElement('span');
                    removeBtn.classList.add('remove-image');
                    removeBtn.innerHTML = '&times;';
                    removeBtn.style.position = 'absolute';
                    removeBtn.style.top = '0';
                    removeBtn.style.right = '0';
                    removeBtn.style.background = 'red';
                    removeBtn.style.color = 'white';
                    removeBtn.style.borderRadius = '50%';
                    removeBtn.style.width = '20px';
                    removeBtn.style.height = '20px';
                    removeBtn.style.display = 'flex';
                    removeBtn.style.alignItems = 'center';
                    removeBtn.style.justifyContent = 'center';
                    removeBtn.style.cursor = 'pointer';
                    
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        imgContainer.remove();
                        
                        const newFiles = Array.from(document.getElementById('product-image-input').files)
                            .filter((_, i) => i !== index);
                        
                        const dataTransfer = new DataTransfer();
                        newFiles.forEach(file => dataTransfer.items.add(file));
                        document.getElementById('product-image-input').files = dataTransfer.files;
                    });
                    
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(removeBtn);
                    preview.appendChild(imgContainer);
                };
                reader.readAsDataURL(file);
            });
        }
        
        async function handlePublishProduct() {
            const productName = document.getElementById('product-name').value.trim();
            const productPrice = document.getElementById('product-price').value;
            const productCategory = document.getElementById('product-category').value;
            const productCondition = document.getElementById('product-condition').value;
            const productDescription = document.getElementById('product-description').value.trim();
            const productPhone = document.getElementById('product-phone').value;
            const files = document.getElementById('product-image-input').files;
            
            if (!productName || !productPrice || !productCategory || !productCondition || !productPhone || !files || files.length === 0) {
                showNotification("الرجاء تعبئة جميع الحقول المطلوبة", "error");
                return;
            }
            
            if (files.length > 4) {
                showNotification("يمكنك رفع 4 صور كحد أقصى", "error");
                return;
            }
            
            try {
                toggleButtonLoading(publishProductBtn, true);
                
                const imagePaths = [];
                for (let file of files) {
                    const ext = file.name.split('.').pop();
                    const fileName = `${currentUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
                    const filePath = `product-images/${fileName}`;
                    
                    const { error: uploadError } = await supabase.storage
                        .from('product-images')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            contentType: file.type,
                            upsert: false
                        });
                    
                    if (uploadError) throw uploadError;
                    imagePaths.push(filePath);
                }
                
                const { data, error: insertError } = await supabase
                    .from('products')
                    .insert([{
                        user_id: currentUser.id,
                        name: productName,
                        price: parseFloat(productPrice),
                        category: productCategory,
                        condition: productCondition,
                        description: productDescription,
                        phone: `+213${productPhone}`,
                        image_paths: imagePaths,
                        created_at: new Date().toISOString(),
                        views: 0,
                        likes: 0
                    }])
                    .select();
                
                if (insertError) throw insertError;
                
                await sendNewProductNotification(productName, data[0].id);
                
                showNotification("تم نشر المنتج بنجاح", "success");
                resetProductForm();
                await loadProducts();
                showStorePage();
                
            } catch (error) {
                console.error("خطأ في نشر المنتج:", error);
                
                if (imagePaths?.length > 0) {
                    await supabase.storage
                        .from('product-images')
                        .remove(imagePaths)
                        .catch(console.error);
                }
                
                showNotification("خطأ في نشر المنتج: " + (error.message || "تأكد من صحة البيانات"), "error");
            } finally {
                toggleButtonLoading(publishProductBtn, false);
            }
        }
        
        async function sendNewProductNotification(productName, productId) {
            try {
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('id')
                    .neq('id', currentUser.id);
                
                if (error) throw error;
                
                if (users?.length > 0) {
                    const notifications = users.map(user => ({
                        user_id: user.id,
                        message: `📦 ${currentUser.full_name} نشر منتج جديد: "${productName}"`,
                        related_product_id: productId,
                        is_read: false,
                        created_at: new Date().toISOString()
                    }));
                    
                    const { error: insertError } = await supabase
                        .from('notifications')
                        .insert(notifications);
                    
                    if (!insertError) {
                        playNotificationSound();
                    }
                }
            } catch (error) {
                console.error("خطأ في إرسال الإشعارات:", error);
            }
        }
        
        async function handleDeleteProduct() {
            if (!productToDelete || !currentUser) return;

            try {
                toggleButtonLoading(document.getElementById('confirm-delete-product'), true);
                
                const { data: product, error: fetchError } = await supabase
                    .from('products')
                    .select('image_paths')
                    .eq('id', productToDelete)
                    .single();
                
                if (fetchError) throw fetchError;
                
                if (product?.image_paths?.length > 0) {
                    await supabase.storage
                        .from('product-images')
                        .remove(product.image_paths)
                        .catch(console.error);
                }
                
                const { error: deleteError } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', productToDelete);
                
                if (deleteError) throw deleteError;
                
                products = products.filter(p => p.id !== productToDelete);
                renderProducts();
                
                hideModal(deleteProductModal);
                showNotification("تم حذف المنتج بنجاح", "success");
                productToDelete = null;
                
            } catch (error) {
                console.error("خطأ في حذف المنتج:", error);
                showNotification("خطأ في حذف المنتج: " + error.message, "error");
            } finally {
                toggleButtonLoading(document.getElementById('confirm-delete-product'), false);
            }
        }
        
        function setupRealtimeNotifications() {
            if (!currentUser) return;
            
            if (notificationChannel) {
                supabase.removeChannel(notificationChannel);
            }

            notificationChannel = supabase.channel('notifications-channel')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUser.id}`
                }, handleNewNotification)
                .on('close', () => {
                    console.log('Channel closed, attempting to reconnect...');
                    attemptReconnect();
                })
                .on('error', (error) => {
                    console.error('Channel error:', error);
                    attemptReconnect();
                })
                .subscribe();
        }

        function attemptReconnect() {
            setTimeout(() => {
                setupRealtimeNotifications();
            }, 5000);
        }
        
        async function handleNewNotification(payload) {
            try {
                console.log('New notification received:', payload);
                
                let productInfo = '';
                if (payload.new.related_product_id) {
                    const { data: product, error } = await supabase
                        .from('products')
                        .select('name')
                        .eq('id', payload.new.related_product_id)
                        .single();
                        
                    if (!error && product) {
                        productInfo = ` (${product.name})`;
                    }
                }
                
                notifications.unshift({
                    ...payload.new,
                    productInfo: productInfo
                });
                
                if (notifications.length > 10) {
                    notifications.pop();
                }
                
                renderNotifications();
                updateNotificationBadge();
                
                if (document.visibilityState === 'visible') {
                    showNotification(`${payload.new.message}${productInfo}`, "info");
                    playNotificationSound();
                } else {
                    showBrowserNotification("إشعار جديد", `${payload.new.message}${productInfo}`);
                }
                
            } catch (error) {
                console.error('Error handling notification:', error);
            }
        }
        
        async function loadNotifications() {
            if (!currentUser) return;
            
            try {
                const { data: notificationsData, error } = await supabase
                    .from('notifications')
                    .select('id, message, created_at, is_read, related_product_id')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(10);
                    
                if (error) throw error;
                
                notifications = notificationsData || [];
                renderNotifications();
                updateNotificationBadge();
                
            } catch (error) {
                console.error("خطأ في جلب الإشعارات:", error);
                return [];
            }
        }
        
        function renderNotifications() {
            const panel = document.getElementById('notifications-panel');
            panel.innerHTML = '';
            
            if (notifications.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'notification-item';
                emptyItem.innerHTML = '<p>لا توجد إشعارات جديدة</p>';
                panel.appendChild(emptyItem);
                return;
            }
            
            notifications.forEach(notif => {
                const item = document.createElement('div');
                item.className = 'notification-item';
                item.setAttribute('role', 'article');
                
                if (!notif.is_read) {
                    item.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
                    item.style.borderLeft = '3px solid var(--notification-color)';
                }
                
                item.innerHTML = `
                    <p>${escapeHtml(notif.message)}${notif.productInfo || ''}</p>
                    <small>${formatTimeAgo(notif.created_at)}</small>
                `;
                
                if (notif.related_product_id) {
                    item.style.cursor = 'pointer';
                    item.addEventListener('click', async () => {
                        lastSeenProductId = notif.related_product_id;
                        await loadProducts();
                        showStorePage();
                        panel.style.display = 'none';
                        markNotificationAsRead(notif.id);
                    });
                }
                
                panel.appendChild(item);
            });
        }
        
        async function markNotificationAsRead(notificationId) {
            try {
                const { error } = await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('id', notificationId);
                
                if (!error) {
                    const notification = notifications.find(n => n.id === notificationId);
                    if (notification) {
                        notification.is_read = true;
                    }
                    updateNotificationBadge();
                }
            } catch (error) {
                console.error("خطأ في تحديث حالة الإشعار:", error);
            }
        }
        
        function updateNotificationBadge() {
            const unreadCount = notifications.filter(notif => !notif.is_read).length;
            const badge = document.getElementById('notification-badge');
            
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'flex';
                badge.setAttribute('aria-label', `${unreadCount} إشعار غير مقروء`);
            } else {
                badge.style.display = 'none';
                badge.removeAttribute('aria-label');
            }
        }
        
        function toggleNotificationsPanel(e) {
            e.stopPropagation();
            const panel = document.getElementById('notifications-panel');
            panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
            
            if (panel.style.display === 'block') {
                markAllNotificationsAsRead();
            }
        }
        
        async function markAllNotificationsAsRead() {
            const unreadIds = notifications
                .filter(n => !n.is_read)
                .map(n => n.id);
            
            if (unreadIds.length === 0) return;
            
            try {
                const { error } = await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .in('id', unreadIds);
                
                if (!error) {
                    notifications.forEach(n => n.is_read = true);
                    updateNotificationBadge();
                }
            } catch (error) {
                console.error("خطأ في تحديث الإشعارات:", error);
            }
        }
        
        function handleOutsideNotificationsClick(e) {
            const panel = document.getElementById('notifications-panel');
            if (!panel.contains(e.target) && e.target !== notificationsBtn) {
                panel.style.display = 'none';
            }
        }
        
        function openImageViewer(images) {
            currentViewingImages = images;
            currentImageIndex = 0;

            viewerMainImage.src = images[0];
            viewerMainImage.alt = 'صورة المنتج';

            imageThumbnails.innerHTML = '';
            images.forEach((img, index) => {
                const thumb = document.createElement('img');
                thumb.src = img;
                thumb.classList.add('image-viewer-thumbnail');
                thumb.alt = `صورة مصغرة ${index + 1}`;
                if (index === 0) thumb.classList.add('active');

                thumb.addEventListener('click', () => {
                    currentImageIndex = index;
                    updateImageViewer();
                });

                imageThumbnails.appendChild(thumb);
            });

            showModal(imageViewerModal);
        }
        
        function updateImageViewer() {
            if (currentViewingImages.length > 0) {
                viewerMainImage.src = currentViewingImages[currentImageIndex];
                
                const thumbnails = imageThumbnails.querySelectorAll('.image-viewer-thumbnail');
                thumbnails.forEach((thumb, index) => {
                    if (index === currentImageIndex) {
                        thumb.classList.add('active');
                    } else {
                        thumb.classList.remove('active');
                    }
                });
            }
        }
        
        function showPrevImage() {
            if (currentViewingImages.length > 0) {
                currentImageIndex = (currentImageIndex - 1 + currentViewingImages.length) % currentViewingImages.length;
                updateImageViewer();
            }
        }
        
        function showNextImage() {
            if (currentViewingImages.length > 0) {
                currentImageIndex = (currentImageIndex + 1) % currentViewingImages.length;
                updateImageViewer();
            }
        }
        
        function togglePages(hidePage, showPage) {
            hidePage.style.display = 'none';
            showPage.style.display = 'block';
            window.scrollTo(0, 0);
        }
        
        function showModal(modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
        
        function hideModal(modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
        
        function showProfilePage() {
            togglePages(storePage, profilePage);
            updateProfilePage();
        }
        
        function showStorePage() {
            [loginPage, otpPage, registerPage, profilePage, addProductPage].forEach(page => {
                page.style.display = 'none';
            });
            storePage.style.display = 'block';
            renderProducts();
            window.scrollTo(0, 0);
        }
        
        function showLoginPage() {
            [storePage, otpPage, registerPage, profilePage, addProductPage].forEach(page => {
                page.style.display = 'none';
            });
            loginPage.style.display = 'block';
            window.scrollTo(0, 0);
        }
        
        function toggleButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        const originalText = button.querySelector('span')?.textContent || button.textContent;
        button.innerHTML = '<span class="spinner"></span> ' + originalText.trim();
    } else {
        button.disabled = false;
        const originalText = button.querySelector('span')?.textContent || button.textContent;
        button.textContent = originalText.trim();
    }
}
        
        function showNotification(message, type = "info") {
            const notification = document.getElementById('notification');
            const notificationMessage = document.getElementById('notification-message');
            
            notification.className = `notification ${type}`;
            notificationMessage.textContent = message;
            notification.style.display = 'flex';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, type === 'error' ? 5000 : 3000);
        }
        
        function playNotificationSound() {
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/221/221-preview.mp3');
                audio.volume = 0.3;
                audio.play().catch(e => console.log('تعذر تشغيل الصوت:', e));
            } catch (error) {
                console.log('تعذر تشغيل صوت الإشعار:', error);
            }
        }
        
        async function showBrowserNotification(title, body) {
            if (!('Notification' in window)) return;
            
            if (Notification.permission === 'granted') {
                new Notification(title, { body });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            }
        }
        
        function formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            if (diffInSeconds < 60) return `منذ ${diffInSeconds} ثانية`;
            
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
            
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
            
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
            
            return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
        }
        
        function setupOTPInputs() {
            otpInputs.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    if (e.inputType === 'insertFromPaste') {
                        const pasteData = e.clipboardData.getData('text');
                        if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
                            otpInputs.forEach((input, i) => {
                                input.value = pasteData[i] || '';
                            });
                            otpInputs[5].focus();
                            e.preventDefault();
                        }
                    } else if (input.value.length === 1 && index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                });
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                        otpInputs[index - 1].focus();
                    }
                });
            });
        }
        
        function escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe.toString()
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                
                await supabase
                    .from('notifications')
                    .delete()
                    .lt('created_at', oneMonthAgo.toISOString());
                    
                console.log('Old notifications cleaned up');
            } catch (error) {
                console.error('Error cleaning up notifications:', error);
            }
        });
    