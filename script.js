document.addEventListener('DOMContentLoaded', () => {
    // Hero Slider Logic
    const heroSlider = document.querySelector('.hero-slider');
    if (heroSlider) {
        const slides = heroSlider.querySelectorAll('.hero-slide');
        let currentSlide = 0;
        const slideInterval = 5000; // 5 seconds

        function nextSlide() {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }

        if (slides.length > 1) {
            setInterval(nextSlide, slideInterval);
        }
    }
    // Scroll event for sticky navbar
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('toggle');
            
            // Adjust logo color if menu is open and not scrolled
            if (navLinks.classList.contains('active') && window.scrollY <= 50) {
               document.querySelector('.logo').style.color = 'var(--text-dark)';
               hamburger.querySelectorAll('span').forEach(s => s.style.backgroundColor = 'var(--text-dark)');
            } else if (!navLinks.classList.contains('active') && window.scrollY <= 50) {
               document.querySelector('.logo').style.color = '#fff';
               hamburger.querySelectorAll('span').forEach(s => s.style.backgroundColor = '#fff');
            }
        });
    }

    // Scroll fade-in animations via Intersection Observer
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const isMobile = window.innerWidth <= 768;
    const appearOptions = {
        threshold: isMobile ? 0.05 : 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    fadeElements.forEach(el => {
        appearOnScroll.observe(el);
    });

    // Active link highlighting
    const currentPath = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.nav-links a');
    
    navItems.forEach(link => {
        if (link.getAttribute('href') === currentPath || (currentPath === '' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('active-nav');
        }
    });

    // Form Validation (if contact form exists)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            // Simulate form submission
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent';
                btn.style.backgroundColor = '#28a745';
                btn.style.borderColor = '#28a745';
                contactForm.reset();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                    btn.style.backgroundColor = 'var(--primary-color)';
                    btn.style.borderColor = 'var(--primary-color)';
                }, 3000);
            }, 1500);
        });
    }

    // Global Data Definitions
    const roomPrices = {
        "Platinum Penthouse": 450,
        "Pearl Studio": 150,
        "Sapphire Apartment": 250,
        "Ruby Apartment": 250,
        "Gold Apartment": 300,
        "Diamond Apartment": 350
    };

    let globalSettings = { 
        showPrices: true, 
        blockedDates: [], 
        aptPrices: {} 
    };

    // Firebase Snapshot for Settings
    if (typeof db !== 'undefined') {
        db.collection('settings').doc('global').onSnapshot(doc => {
            if(doc.exists) {
                // console.log("Settings updated:", doc.data());
                globalSettings = { ...globalSettings, ...doc.data() };
                applyGlobalSettings();
                if(typeof window.updateBookingSummary === 'function') window.updateBookingSummary();
                if(typeof window.updateWidgetSummary === 'function') window.updateWidgetSummary();
            }
        });
    }

    function applyGlobalSettings() {
        if (globalSettings.aptPrices) {
            Object.assign(roomPrices, globalSettings.aptPrices);
        }

        const updatePriceDisplay = (container, titleSelector, priceSelector) => {
            const titleEl = container.querySelector(titleSelector);
            const priceEl = container.querySelector(priceSelector);
            if (titleEl && priceEl) {
                const roomTitle = titleEl.textContent.trim();
                // Find matching key case-insensitively
                const matchingKey = Object.keys(globalSettings.aptPrices || {}).find(
                    key => key.toLowerCase() === roomTitle.toLowerCase()
                );
                
                if (matchingKey) {
                    const price = globalSettings.aptPrices[matchingKey];
                    const span = priceEl.querySelector('span');
                    if (span) {
                        span.textContent = '$' + price;
                    } else {
                        // If no span, just replace numeric part or whole text
                        priceEl.textContent = 'From $' + price + ' / night';
                    }
                }
            }
        };

        // 1. Accommodation Cards (.room-card)
        document.querySelectorAll('.room-card').forEach(card => updatePriceDisplay(card, 'h3', '.room-price'));

        // 2. Best Room Cards on Homepage (.best-room-card)
        document.querySelectorAll('.best-room-card').forEach(card => updatePriceDisplay(card, 'h3', '.best-room-price'));

        // 3. Related Room Cards (.related-room-card)
        document.querySelectorAll('.related-room-card').forEach(card => updatePriceDisplay(card, '.related-room-title', '.related-room-price'));

        // 4. Booking Widget Sidebar
        const widgetPriceSpan = document.querySelector('#widget-price-val');
        const hiddenRoomInput = document.getElementById('hidden-room-input');
        if (widgetPriceSpan && hiddenRoomInput && hiddenRoomInput.value) {
            const currentRoom = hiddenRoomInput.value.trim().toLowerCase();
            const matchingKey = Object.keys(globalSettings.aptPrices || {}).find(key => key.toLowerCase() === currentRoom);
            if (matchingKey) {
                widgetPriceSpan.textContent = '$' + globalSettings.aptPrices[matchingKey];
            }
        }

        // Toggle price visibility
        const priceElements = document.querySelectorAll('.room-price, .widget-price, #booking-summary, .related-room-price, .best-room-price');
        priceElements.forEach(el => {
            if (globalSettings.showPrices === false) {
                if(!el.classList.contains('always-show')) el.style.display = 'none';
            } else {
                if(!el.classList.contains('always-hide')) el.style.display = '';
            }
        });
    }



    // Auto-fill dates
    const today = new Date();
    const tmrw = new Date(today);
    tmrw.setDate(tmrw.getDate() + 1);
    const todayStr = today.toISOString().split('T')[0];
    const tmrwStr = tmrw.toISOString().split('T')[0];

    document.querySelectorAll('input[type="date"]').forEach(input => {
        if(!input.value) {
            if(input.id.includes('arrival') || input.id.includes('start') || input.id.includes('date')) {
                input.value = todayStr;
            } else if (input.id.includes('departure') || input.id.includes('end')) {
                input.value = tmrwStr;
            }
        }
    });

    // Sidebar Widget Summary listener
    window.updateWidgetSummary = function() {
        const arrInput = document.getElementById('widget-arrival');
        const depInput = document.getElementById('widget-departure');
        const hiddenInput = document.getElementById('hidden-room-input');
        const summary = document.getElementById('widget-summary');
        
        if (arrInput && depInput && hiddenInput && summary) {
            const arr = new Date(arrInput.value);
            const dep = new Date(depInput.value);
            if (arr && dep && dep > arr) {
                 const nights = Math.ceil((dep - arr) / (1000 * 3600 * 24));
                 
                 let isBlocked = false;
                 let blockReason = 'Unavailable';
                 const apt = hiddenInput.value; // Using apartment title directly because it's populated on load by room-details.html

                 if (globalSettings && globalSettings.blockedDates) {
                     for (let b of globalSettings.blockedDates) {
                         if (b.apartment === 'all' || b.apartment === apt) {
                             const bStart = new Date(b.start);
                             const bEnd = new Date(b.end);
                             if (arr <= bEnd && dep > bStart) {
                                 isBlocked = true;
                                 if(b.reason) blockReason = b.reason;
                                 break;
                             }
                         }
                     }
                 }
                 
                 const form = document.getElementById('room-details-widget-form');
                 const btn = form ? form.querySelector('.open-booking-modal-btn') : null;
                 const nightsSpan = document.getElementById('widget-nights');
                 const totalSpan = document.getElementById('widget-total-price');
                 
                 if (isBlocked) {
                      summary.style.display = 'block';
                      if(nightsSpan) nightsSpan.textContent = '0';
                      if(totalSpan) totalSpan.textContent = 'Blocked';
                      if (btn) {
                          btn.disabled = true;
                          btn.textContent = 'Dates Not Available';
                          btn.style.backgroundColor = '#dc3545';
                          btn.style.borderColor = '#dc3545';
                      }
                 } else {
                      summary.style.display = globalSettings.showPrices !== false ? 'block' : 'none';
                      if(nightsSpan) nightsSpan.textContent = nights;
                      
                      const price = (globalSettings && globalSettings.aptPrices && globalSettings.aptPrices[apt]) ? globalSettings.aptPrices[apt] : (roomPrices[apt]||0);
                      if (totalSpan) totalSpan.textContent = price * nights;
                      
                      if (btn) {
                          btn.disabled = false;
                          btn.textContent = 'Reserve Now';
                          btn.style.backgroundColor = 'var(--primary-color)';
                          btn.style.borderColor = 'var(--primary-color)';
                      }
                 }
            } else {
                summary.style.display = 'none';
            }
        }
    };
    
    if(document.getElementById('widget-arrival')) document.getElementById('widget-arrival').addEventListener('change', updateWidgetSummary);
    if(document.getElementById('widget-departure')) document.getElementById('widget-departure').addEventListener('change', updateWidgetSummary);


    window.updateBookingSummary = function() {
        const aptSelect = document.getElementById('modal-apartment');
        const arrivalInput = document.getElementById('modal-arrival');
        const departureInput = document.getElementById('modal-departure');
        const summaryDiv = document.getElementById('booking-summary');
        const nightsSpan = document.getElementById('modal-nights');
        const pricePerNightSpan = document.getElementById('modal-price-per-night');
        const totalPriceSpan = document.getElementById('modal-total-price');

        if (!aptSelect || !arrivalInput || !departureInput || !summaryDiv) return;

        const apt = aptSelect.value;
        const arrival = new Date(arrivalInput.value);
        const departure = new Date(departureInput.value);

        if (apt && arrivalInput.value && departureInput.value && departure > arrival) {

            // Validate Blocked Dates
            let isBlocked = false;
            let blockReason = 'Dates Unavailable';
            
            if (globalSettings.blockedDates && globalSettings.blockedDates.length > 0) {
                 for (let b of globalSettings.blockedDates) {
                     if (b.apartment === 'all' || b.apartment === apt) {
                         const bStart = new Date(b.start);
                         const bEnd = new Date(b.end);
                         if (arrival <= bEnd && departure > bStart) {
                             isBlocked = true;
                             if(b.reason) blockReason = b.reason;
                             break;
                         }
                     }
                 }
            }

            const submitBtn = document.querySelector('#finalBookingForm button[type="submit"]');

            if (isBlocked) {
                if (totalPriceSpan) totalPriceSpan.textContent = 'Unavailable';
                if (nightsSpan) nightsSpan.textContent = '0';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = 'Dates Not Available';
                    submitBtn.style.backgroundColor = '#dc3545';
                    submitBtn.style.borderColor = '#dc3545';
                }
                summaryDiv.style.display = 'block';
                return;
            } else if (submitBtn) {
                 submitBtn.disabled = false;
                 submitBtn.innerHTML = 'Complete Reservation';
                 submitBtn.style.backgroundColor = 'var(--primary-color)';
                 submitBtn.style.borderColor = 'var(--primary-color)';
            }

            const timeDiff = departure.getTime() - arrival.getTime();
            const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const pricePerNight = roomPrices[apt] || 0;
            const total = nights * pricePerNight;

            if (nightsSpan) nightsSpan.textContent = nights;
            if (pricePerNightSpan) pricePerNightSpan.textContent = pricePerNight;
            if (totalPriceSpan) totalPriceSpan.textContent = total;

            if (globalSettings.showPrices !== false) {
                summaryDiv.style.display = 'block';
            } else {
                summaryDiv.style.display = 'none';
            }
        } else {
            summaryDiv.style.display = 'none';
        }
    };

    if (document.getElementById('modal-apartment')) document.getElementById('modal-apartment').addEventListener('change', window.updateBookingSummary);
    if (document.getElementById('modal-arrival')) document.getElementById('modal-arrival').addEventListener('change', window.updateBookingSummary);
    if (document.getElementById('modal-departure')) document.getElementById('modal-departure').addEventListener('change', window.updateBookingSummary);

    const openModalBtns = document.querySelectorAll('#open-booking-modal-btn, .open-booking-modal-btn');
    const bookingModal = document.getElementById('bookingModal');
    const closeBookingModal = document.getElementById('closeBookingModal');

    if (openModalBtns.length > 0 && bookingModal) {
        openModalBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // Room Value
                let roomValue = btn.getAttribute('data-room');
                if (!roomValue && document.getElementById('filter-apartment')) {
                    roomValue = document.getElementById('filter-apartment').value;
                }
                if (!roomValue && document.getElementById('hidden-room-input')) {
                    roomValue = document.getElementById('hidden-room-input').value;
                }
                if (document.getElementById('modal-apartment')) {
                    document.getElementById('modal-apartment').value = roomValue || '';
                }

                // Dates
                const filterArr = document.getElementById('filter-arrival');
                const widgetArr = document.getElementById('widget-arrival');
                if (document.getElementById('modal-arrival')) {
                    document.getElementById('modal-arrival').value = filterArr ? filterArr.value : (widgetArr ? widgetArr.value : '');
                }

                const filterDep = document.getElementById('filter-departure');
                const widgetDep = document.getElementById('widget-departure');
                if (document.getElementById('modal-departure')) {
                    document.getElementById('modal-departure').value = filterDep ? filterDep.value : (widgetDep ? widgetDep.value : '');
                }

                // Guests
                const filterAdults = document.getElementById('filter-adults');
                const widgetGuests = document.getElementById('widget-guests');
                let adultsVal = filterAdults ? filterAdults.value : '2';
                if (!filterAdults && widgetGuests) adultsVal = widgetGuests.value;
                
                if (document.getElementById('modal-adults')) {
                    document.getElementById('modal-adults').value = adultsVal;
                }

                const filterChildren = document.getElementById('filter-children');
                if (document.getElementById('modal-children')) {
                    document.getElementById('modal-children').value = filterChildren ? filterChildren.value : '0';
                }

                // Show modal
                bookingModal.style.display = 'flex';
                // slight delay to allow display:flex to apply before adding class for opacity transition
                setTimeout(() => {
                    bookingModal.classList.add('show');
                    if(typeof window.updateBookingSummary === 'function') window.updateBookingSummary();
                }, 10);
            });
        });
    }

    if (closeBookingModal && bookingModal) {
        closeBookingModal.addEventListener('click', () => {
            bookingModal.classList.remove('show');
            setTimeout(() => {
                bookingModal.style.display = 'none';
            }, 300);
        });
    }

    // Close when clicking outside of modal
    window.addEventListener('click', (e) => {
        if (e.target === bookingModal) {
            bookingModal.classList.remove('show');
            setTimeout(() => {
                bookingModal.style.display = 'none';
            }, 300);
        }
    });

    const finalBookingForm = document.getElementById('finalBookingForm');
    if (finalBookingForm) {
        finalBookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = finalBookingForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            const reqField = document.getElementById('modal-requests');
            const nightsField = document.getElementById('modal-nights');
            const totalField = document.getElementById('modal-total-price');
            
            const reservationData = {
                apartment: document.getElementById('modal-apartment').value,
                arrival: document.getElementById('modal-arrival').value,
                departure: document.getElementById('modal-departure').value,
                adults: document.getElementById('modal-adults').value,
                children: document.getElementById('modal-children').value,
                name: document.getElementById('modal-name').value,
                email: document.getElementById('modal-email').value,
                phone: document.getElementById('modal-phone').value,
                requests: reqField ? reqField.value : '',
                nights: nightsField ? parseInt(nightsField.textContent) || 0 : 0,
                totalPrice: totalField ? parseFloat(totalField.textContent) || 0 : 0,
                status: 'pending',
                payment: 'unpaid',
                timestamp: typeof firebase !== 'undefined' ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
            };

            if (typeof db !== 'undefined') {
                db.collection('reservations').add(reservationData).then(() => {
                    showSuccess(btn, originalText);
                }).catch((error) => {
                    console.error("Error saving booking: ", error);
                    btn.innerHTML = "Error! Try Again.";
                    btn.disabled = false;
                });
            } else {
                console.warn('Firebase not initialized. Simulating save.');
                setTimeout(() => showSuccess(btn, originalText), 1500);
            }
            
            function showSuccess(btnElement, text) {
                btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Request Sent';
                btnElement.style.backgroundColor = '#28a745';
                btnElement.style.borderColor = '#28a745';
                setTimeout(() => {
                    bookingModal.classList.remove('show');
                    setTimeout(() => {
                        bookingModal.style.display = 'none';
                        btnElement.innerHTML = text;
                        btnElement.disabled = false;
                        btnElement.style.backgroundColor = 'var(--primary-color)';
                        btnElement.style.borderColor = 'var(--primary-color)';
                        finalBookingForm.reset();
                    }, 300);
                }, 1500);
            }
        });
    }

    // Safari Booking Form
    const safariForm = document.getElementById('safariBookingForm');
    if (safariForm) {
        safariForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = safariForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            const formData = new FormData(safariForm);
            
            const safariData = {
                safari: document.getElementById('hidden-safari-input').value,
                name: formData.get('name'),
                email: formData.get('email'),
                date: formData.get('date'),
                adults: formData.get('adults'),
                children: formData.get('children'),
                notes: formData.get('notes'),
                status: 'pending',
                timestamp: typeof firebase !== 'undefined' ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
            };
            
            if (typeof db !== 'undefined') {
                db.collection('safari_bookings').add(safariData).then(() => {
                    showSafariSuccess(btn, originalText);
                }).catch((error) => {
                    console.error("Error saving safari booking: ", error);
                    btn.innerHTML = 'Error. Try Again.';
                    btn.disabled = false;
                });
            } else {
                console.warn('Firebase not initialized. Simulating save.');
                setTimeout(() => showSafariSuccess(btn, originalText), 1500);
            }

            function showSafariSuccess(btnElement, text) {
                btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Submitted';
                btnElement.style.backgroundColor = '#28a745';
                btnElement.style.borderColor = '#28a745';
                setTimeout(() => {
                    safariForm.reset();
                    btnElement.innerHTML = text;
                    btnElement.disabled = false;
                    btnElement.style.backgroundColor = 'var(--primary-color)';
                    btnElement.style.borderColor = 'var(--primary-color)';
                }, 3000);
            }
        });
    }
});
