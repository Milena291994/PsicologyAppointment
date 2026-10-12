/**
 * Controlador de Interacción y Flujo para el Portal de Citas Psicológicas
 * Psicología y Mente • shadcn/ui & Sonner
 */

document.addEventListener("DOMContentLoaded", () => {
    // Estado global de la aplicación
    const state = {
        currentStep: 1, // 1: Fecha, 2: Hora, 3: Datos y Confirmación, 4: Pago Payphone
        selectedDate: null,
        selectedTime: null,
        modality: "online", // 'online' | 'presencial'
        currentMonth: new Date().getMonth(),
        currentYear: new Date().getFullYear(),
        patientMode: "new", // 'new' | 'returning'
        patientData: {
            identification: "",
            fullName: "",
            email: "",
            phone: "",
            birthDate: "",
            consultReason: "Ansiedad y estrés",
            firstTimeTherapy: "si",
            acceptedTerms: false
        },
        tentativeDates: []
    };

    // Helper seguro para llamar a Sonner toast
    const notify = {
        success: (title, desc) => window.toast?.success(title, { description: desc }) || console.log(title, desc),
        error: (title, desc) => window.toast?.error(title, { description: desc }) || console.error(title, desc),
        warning: (title, desc) => window.toast?.warning(title, { description: desc }) || console.warn(title, desc),
        info: (title, desc) => window.toast?.info(title, { description: desc }) || console.info(title, desc),
        default: (title, desc) => window.toast ? window.toast(title, { description: desc }) : console.log(title, desc)
    };

    // Inicializar fecha por defecto (mañana hábil o siguiente disponible)
    const initDefaultDate = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        // Si mañana es domingo (0), saltar a lunes
        if (tomorrow.getDay() === 0) {
            tomorrow.setDate(tomorrow.getDate() + 1);
        }
        
        state.selectedDate = formatDateKey(tomorrow);
        calculateTentativeDates(tomorrow);
    };

    // =========================================================================
    // UTILIDADES DE FECHA
    // =========================================================================
    function formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function parseDateKey(dateKey) {
        const [y, m, d] = dateKey.split("-").map(Number);
        return new Date(y, m - 1, d);
    }

    function formatDisplayDate(dateKey, withYear = false) {
        if (!dateKey) return "Sin fecha seleccionada";
        const date = parseDateKey(dateKey);
        const options = { 
            weekday: "long", 
            day: "numeric", 
            month: "long" 
        };
        if (withYear) options.year = "numeric";
        const formatted = date.toLocaleDateString("es-ES", options);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    // Calcular 3 fechas tentativas próximas con disponibilidad
    function calculateTentativeDates(baseDate) {
        const tentative = [];
        let cursor = new Date(baseDate);
        
        while (tentative.length < 3) {
            cursor.setDate(cursor.getDate() + 1);
            // Omitir domingos (0)
            if (cursor.getDay() !== 0) {
                tentative.push({
                    dateKey: formatDateKey(cursor),
                    dateObj: new Date(cursor),
                    displayDay: cursor.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
                });
            }
        }
        state.tentativeDates = tentative;
    }

    // =========================================================================
    // RENDERIZADO DEL CALENDARIO
    // =========================================================================
    const calendarGrid = document.getElementById("calendar-grid");
    const calendarMonthLabel = document.getElementById("calendar-month-label");
    const tentativeDatesContainer = document.getElementById("tentative-dates-container");

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    function renderCalendar() {
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = "";
        calendarMonthLabel.textContent = `${monthNames[state.currentMonth]} ${state.currentYear}`;

        const firstDayOfMonth = new Date(state.currentYear, state.currentMonth, 1);
        const lastDayOfMonth = new Date(state.currentYear, state.currentMonth + 1, 0);
        
        // Ajustar primer día de semana (0=Dom -> 6, 1=Lun -> 0)
        let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startingDayOfWeek === -1) startingDayOfWeek = 6;

        const totalDays = lastDayOfMonth.getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Espacios vacíos antes del día 1
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "p-2 opacity-0 pointer-events-none";
            calendarGrid.appendChild(emptyCell);
        }

        // Renderizar cada día del mes
        for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
            const dateObj = new Date(state.currentYear, state.currentMonth, dayNum);
            const dateKey = formatDateKey(dateObj);
            const dayOfWeek = dateObj.getDay(); // 0 es Domingo
            const isSunday = dayOfWeek === 0;
            const isPast = dateObj < today;
            const isToday = formatDateKey(today) === dateKey;
            const isSelected = state.selectedDate === dateKey;

            const button = document.createElement("button");
            button.type = "button";
            button.setAttribute("aria-label", `Día ${dayNum} de ${monthNames[state.currentMonth]}`);
            button.className = `calendar-day-btn text-sm font-medium w-9 h-9 sm:w-11 sm:h-11 mx-auto`;

            if (isToday) {
                button.classList.add("today");
            }

            if (isPast || isSunday) {
                button.classList.add("disabled");
                button.setAttribute("disabled", "true");
                button.innerHTML = `<span>${dayNum}</span>`;
            } else {
                button.classList.add("available", "day-has-slots");
                if (isSelected) {
                    button.classList.add("selected");
                }
                button.innerHTML = `<span>${dayNum}</span>`;

                button.addEventListener("click", () => {
                    state.selectedDate = dateKey;
                    state.selectedTime = null;
                    calculateTentativeDates(dateObj);
                    renderCalendar();
                    renderTentativeDates();
                    updateSelectionSummary();
                    updateTimeSlotsUI();

                    // Notificación Sonner
                    notify.info("Fecha seleccionada", `${formatDisplayDate(dateKey)}. Ahora elige tu horario ideal.`);
                });
            }

            calendarGrid.appendChild(button);
        }
    }

    // Renderizar tarjetas de fechas tentativas recomendadas
    function renderTentativeDates() {
        if (!tentativeDatesContainer) return;
        tentativeDatesContainer.innerHTML = "";

        state.tentativeDates.forEach((t, idx) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "flex-1 text-left p-3 rounded-xl border border-border hover:border-primary/50 bg-card hover:bg-accent/40 transition-all text-xs sm:text-sm group focus:outline-none focus:ring-2 focus:ring-ring";
            
            const badgeLabel = idx === 0 ? "Más cercana" : (idx === 1 ? "Recomendada" : "Alternativa");
            
            card.innerHTML = `
                <div class="flex items-center justify-between mb-1.5">
                    <span class="shadcn-badge shadcn-badge-secondary text-[10px] text-primary">${badgeLabel}</span>
                    <i data-lucide="arrow-up-right" class="w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100 transition-opacity"></i>
                </div>
                <div class="font-semibold text-foreground capitalize">${t.displayDay}</div>
                <div class="text-[11px] text-muted-foreground mt-0.5">Cupos disponibles</div>
            `;

            card.addEventListener("click", () => {
                state.selectedDate = t.dateKey;
                state.selectedTime = null;
                const d = parseDateKey(t.dateKey);
                state.currentMonth = d.getMonth();
                state.currentYear = d.getFullYear();
                calculateTentativeDates(d);
                renderCalendar();
                renderTentativeDates();
                updateSelectionSummary();
                updateTimeSlotsUI();

                // Notificación Sonner
                notify.info("Fecha tentativa aplicada", `${formatDisplayDate(t.dateKey)}. Continúa con el horario.`);
            });

            tentativeDatesContainer.appendChild(card);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Botones de mes anterior y siguiente
    document.getElementById("btn-prev-month")?.addEventListener("click", () => {
        state.currentMonth--;
        if (state.currentMonth < 0) {
            state.currentMonth = 11;
            state.currentYear--;
        }
        renderCalendar();
    });

    document.getElementById("btn-next-month")?.addEventListener("click", () => {
        state.currentMonth++;
        if (state.currentMonth > 11) {
            state.currentMonth = 0;
            state.currentYear++;
        }
        renderCalendar();
    });

    // =========================================================================
    // SELECCIÓN DE HORA
    // =========================================================================
    const morningSlotsContainer = document.getElementById("morning-slots-container");
    const afternoonSlotsContainer = document.getElementById("afternoon-slots-container");

    function renderTimeSlots() {
        if (!morningSlotsContainer || !afternoonSlotsContainer) return;

        morningSlotsContainer.innerHTML = "";
        afternoonSlotsContainer.innerHTML = "";

        APP_CONFIG.defaultSlots.forEach(slot => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `time-slot-btn py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-1 w-full bg-white text-gray-700`;
            btn.dataset.time = slot.time;

            const isSelected = state.selectedTime === slot.time;
            if (isSelected) {
                btn.classList.add("selected");
            }

            btn.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <i data-lucide="clock" class="w-3.5 h-3.5 opacity-70"></i>
                    <span>${slot.label}</span>
                </div>
                <span class="text-[10px] ${isSelected ? 'text-emerald-100' : 'text-gray-400'} font-normal">50 min</span>
            `;

            btn.addEventListener("click", () => {
                state.selectedTime = slot.time;
                state.selectedTimeLabel = slot.label;
                updateTimeSlotsUI();
                updateSelectionSummary();
                validateStep2Button();

                // Notificación Sonner
                notify.success(`Horario reservado: ${slot.label}`, "Sesión individual de 50 minutos con la especialista.");
            });

            if (slot.period === "morning") {
                morningSlotsContainer.appendChild(btn);
            } else {
                afternoonSlotsContainer.appendChild(btn);
            }
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function updateTimeSlotsUI() {
        const buttons = document.querySelectorAll(".time-slot-btn");
        buttons.forEach(btn => {
            if (btn.dataset.time === state.selectedTime) {
                btn.classList.add("selected");
                const span = btn.querySelector("span:last-child");
                if (span) {
                    span.classList.remove("text-gray-400");
                    span.classList.add("text-emerald-100");
                }
            } else {
                btn.classList.remove("selected");
                const span = btn.querySelector("span:last-child");
                if (span) {
                    span.classList.remove("text-emerald-100");
                    span.classList.add("text-gray-400");
                }
            }
        });
        validateStep2Button();
    }

    // Modalidad (Online / Presencial) - shadcn Tabs
    document.querySelectorAll(".modality-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".modality-btn").forEach(b => {
                b.classList.remove("active");
                const icon = b.querySelector("i");
                if (icon) {
                    icon.classList.remove("text-primary");
                    icon.classList.add("text-muted-foreground");
                }
            });
            btn.classList.add("active");
            const activeIcon = btn.querySelector("i");
            if (activeIcon) {
                activeIcon.classList.remove("text-muted-foreground");
                activeIcon.classList.add("text-primary");
            }
            state.modality = btn.dataset.modality;
            updateSelectionSummary();

            notify.default(
                state.modality === "online" ? "Modalidad: Videoconsulta" : "Modalidad: Presencial",
                state.modality === "online" ? "Plataforma segura y encriptada (Meet / Zoom Salud)." : "Consultorio 302, Edif. Árbol de Vida."
            );
        });
    });

    // =========================================================================
    // RESUMEN LATERAL EN VIVO (STICKY SUMMARY)
    // =========================================================================
    function updateSelectionSummary() {
        const summaryDateEl = document.getElementById("summary-date");
        const summaryTimeEl = document.getElementById("summary-time");
        const summaryModalityEl = document.getElementById("summary-modality");
        const summaryPatientEl = document.getElementById("summary-patient");

        if (summaryDateEl) {
            summaryDateEl.textContent = state.selectedDate ? formatDisplayDate(state.selectedDate) : "Por seleccionar";
        }
        if (summaryTimeEl) {
            summaryTimeEl.textContent = state.selectedTime ? `${state.selectedTimeLabel || state.selectedTime} (50 min)` : "Por seleccionar";
        }
        if (summaryModalityEl) {
            summaryModalityEl.textContent = state.modality === "online" 
                ? "Videoconsulta confidencial (Google Meet / Zoom Salud)" 
                : "Presencial (Consultorio 302, Edif. Árbol de Vida)";
        }
        if (summaryPatientEl) {
            summaryPatientEl.textContent = state.patientData.fullName 
                ? `${state.patientData.fullName} (${state.patientData.identification || 'Sin ID'})`
                : "Pendiente de ingreso";
        }

        // Actualizar badges en modal de pago y paso de confirmación
        const confirmDoctorName = document.getElementById("confirm-doctor-name");
        if (confirmDoctorName) confirmDoctorName.textContent = APP_CONFIG.specialist.name;

        const confirmDateEl = document.getElementById("confirm-date");
        if (confirmDateEl && state.selectedDate) {
            confirmDateEl.textContent = formatDisplayDate(state.selectedDate, true);
        }

        const confirmTimeEl = document.getElementById("confirm-time");
        if (confirmTimeEl && state.selectedTime) {
            confirmTimeEl.textContent = `${state.selectedTimeLabel || state.selectedTime} (50 min)`;
        }

        const confirmModalityEl = document.getElementById("confirm-modality");
        if (confirmModalityEl) {
            confirmModalityEl.textContent = state.modality === "online" ? "En Línea (Videollamada encriptada)" : "Presencial (En consultorio)";
        }

        const confirmPatientName = document.getElementById("confirm-patient-name");
        if (confirmPatientName) {
            confirmPatientName.textContent = state.patientData.fullName || "Nombre no ingresado";
        }

        const confirmPatientId = document.getElementById("confirm-patient-id");
        if (confirmPatientId) {
            confirmPatientId.textContent = state.patientData.identification || "—";
        }

        const confirmPatientContact = document.getElementById("confirm-patient-contact");
        if (confirmPatientContact) {
            confirmPatientContact.textContent = `${state.patientData.email || '—'} • ${state.patientData.phone || '—'}`;
        }
    }

    // =========================================================================
    // BÚSQUEDA Y GESTIÓN DE PACIENTES (RECURRENTES O NUEVOS)
    // =========================================================================
    const searchPatientInput = document.getElementById("patient-search-input");
    const searchPatientBtn = document.getElementById("btn-search-patient");
    const searchResultBox = document.getElementById("patient-search-result");
    const formIdentification = document.getElementById("form-identification");
    const formFullName = document.getElementById("form-fullname");
    const formEmail = document.getElementById("form-email");
    const formPhone = document.getElementById("form-phone");
    const formBirthDate = document.getElementById("form-birthdate");
    const formConsultReason = document.getElementById("form-consult-reason");
    const formTerms = document.getElementById("form-terms");

    // Función para poblar el formulario con datos
    function populatePatientForm(patient, triggerNotification = true) {
        if (!patient) return;
        state.patientData = {
            identification: patient.identification,
            fullName: patient.fullName,
            email: patient.email,
            phone: patient.phone,
            birthDate: patient.birthDate,
            consultReason: patient.consultReason || "Ansiedad y estrés",
            firstTimeTherapy: "no",
            acceptedTerms: true
        };
        state.patientMode = "returning";

        if (formIdentification) formIdentification.value = patient.identification;
        if (formFullName) formFullName.value = patient.fullName;
        if (formEmail) formEmail.value = patient.email;
        if (formPhone) formPhone.value = patient.phone;
        if (formBirthDate) formBirthDate.value = patient.birthDate || "";
        if (formConsultReason) formConsultReason.value = patient.consultReason || "Ansiedad y estrés";
        if (formTerms) formTerms.checked = true;

        // Feedback visual amigable con estilo shadcn
        if (searchResultBox) {
            searchResultBox.classList.remove("hidden");
            searchResultBox.innerHTML = `
                <div class="p-3.5 rounded-xl bg-secondary/80 border border-border flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                        <i data-lucide="check" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="font-semibold text-foreground text-xs sm:text-sm">¡Hola, ${patient.fullName.split(' ')[0]}!</span>
                            <span class="shadcn-badge shadcn-badge-secondary text-[10px] text-primary">Expediente Encontrado</span>
                        </div>
                        <p class="text-xs text-muted-foreground mt-0.5">Hemos cargado tus datos personales de forma segura para agilizar tu cita.</p>
                        <div class="mt-1 text-[11px] text-primary font-medium">${patient.notes || 'Paciente en seguimiento regular'}</div>
                    </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        updateSelectionSummary();

        if (triggerNotification) {
            notify.success(
                `¡Bienvenido(a) de nuevo, ${patient.fullName.split(' ')[0]}!`,
                "Tus datos clínicos fueron cargados automáticamente con éxito."
            );
        }
    }

    // Búsqueda de paciente
    function handleSearchPatient() {
        const query = searchPatientInput ? searchPatientInput.value.trim().toLowerCase() : "";
        if (!query) {
            notify.error("Ingresa una identificación", "Por favor escribe tu cédula, DNI o correo para buscar tu expediente.");
            return;
        }

        const match = APP_CONFIG.registeredPatients.find(p => 
            p.identification.toLowerCase().includes(query) ||
            p.email.toLowerCase().includes(query) ||
            p.fullName.toLowerCase().includes(query)
        );

        if (match) {
            populatePatientForm(match, true);
        } else {
            notify.warning("Expediente no encontrado", "No encontramos un registro previo. Puedes completar tus datos como paciente nuevo.");
            if (searchResultBox) {
                searchResultBox.classList.remove("hidden");
                searchResultBox.innerHTML = `
                    <div class="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                        <div class="w-7 h-7 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shrink-0">
                            <i data-lucide="alert-circle" class="w-4 h-4"></i>
                        </div>
                        <div class="flex-1">
                            <span class="font-medium text-foreground text-xs">No encontramos un expediente previo con ese dato.</span>
                            <p class="text-[11px] text-muted-foreground mt-0.5">No te preocupes, puedes completar tus datos a continuación como paciente nuevo.</p>
                        </div>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
            }
        }
    }

    searchPatientBtn?.addEventListener("click", handleSearchPatient);
    searchPatientInput?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSearchPatient();
        }
    });

    // Chips de prueba rápida de pacientes
    document.querySelectorAll(".demo-patient-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const patientId = chip.dataset.patientId;
            const patient = APP_CONFIG.registeredPatients.find(p => p.id === patientId);
            if (patient) {
                if (searchPatientInput) searchPatientInput.value = patient.identification;
                populatePatientForm(patient, true);
            }
        });
    });

    // Cambiar a "Registrarme como nuevo paciente"
    document.getElementById("btn-clear-patient")?.addEventListener("click", () => {
        state.patientMode = "new";
        state.patientData = {
            identification: "",
            fullName: "",
            email: "",
            phone: "",
            birthDate: "",
            consultReason: "Ansiedad y estrés",
            firstTimeTherapy: "si",
            acceptedTerms: false
        };
        if (formIdentification) formIdentification.value = "";
        if (formFullName) formFullName.value = "";
        if (formEmail) formEmail.value = "";
        if (formPhone) formPhone.value = "";
        if (formBirthDate) formBirthDate.value = "";
        if (formTerms) formTerms.checked = false;
        if (searchPatientInput) searchPatientInput.value = "";
        if (searchResultBox) searchResultBox.classList.add("hidden");
        updateSelectionSummary();

        notify.default("Modo nuevo paciente", "Formulario listo para ingresar datos personales por primera vez.");
    });

    // Escuchar inputs del formulario para sincronizar datos
    function syncFormToState() {
        state.patientData.identification = formIdentification?.value.trim() || "";
        state.patientData.fullName = formFullName?.value.trim() || "";
        state.patientData.email = formEmail?.value.trim() || "";
        state.patientData.phone = formPhone?.value.trim() || "";
        state.patientData.birthDate = formBirthDate?.value || "";
        state.patientData.consultReason = formConsultReason?.value || "Ansiedad y estrés";
        state.patientData.acceptedTerms = formTerms?.checked || false;
        updateSelectionSummary();
    }

    [formIdentification, formFullName, formEmail, formPhone, formBirthDate, formConsultReason].forEach(input => {
        input?.addEventListener("input", syncFormToState);
    });
    formTerms?.addEventListener("change", syncFormToState);

    // =========================================================================
    // NAVEGACIÓN ENTRE PASOS (1 -> 2 -> 3 -> 4)
    // =========================================================================
    const stepIndicators = document.querySelectorAll(".step-indicator");
    const stepContainers = document.querySelectorAll(".step-section");

    function goToStep(targetStep) {
        if (targetStep < 1 || targetStep > 4) return;

        // Validaciones amigables con Sonner antes de avanzar
        if (targetStep > 1 && !state.selectedDate) {
            notify.error("Fecha requerida", "Por favor selecciona un día en el calendario antes de continuar.");
            return;
        }

        if (targetStep > 2 && !state.selectedTime) {
            notify.error("Horario requerido", "Por favor elige la hora en que deseas tu consulta.");
            return;
        }

        if (targetStep > 3) {
            syncFormToState();
            if (!state.patientData.fullName || !state.patientData.email || !state.patientData.phone) {
                notify.error("Datos incompletos", "Por favor completa Nombre, Correo y Celular para agendar tu cita.");
                return;
            }
            if (!state.patientData.acceptedTerms) {
                notify.warning("Consentimiento requerido", "Por favor acepta el consentimiento informado y confidencialidad psicológica.");
                return;
            }
            notify.success("Datos confirmados", "Información del paciente verificada correctamente.");
        }

        state.currentStep = targetStep;

        // Actualizar visual de pasos en el header
        stepIndicators.forEach(ind => {
            const stepNum = parseInt(ind.dataset.step, 10);
            const circle = ind.querySelector(".step-circle");
            const label = ind.querySelector(".step-label");

            if (stepNum === targetStep) {
                circle.classList.remove("bg-white", "text-gray-500", "bg-emerald-600", "text-white");
                circle.classList.add("bg-emerald-700", "text-white", "ring-4", "ring-emerald-100");
                label.classList.remove("text-gray-400", "text-emerald-700");
                label.classList.add("text-emerald-900", "font-semibold");
            } else if (stepNum < targetStep) {
                circle.classList.remove("bg-white", "text-gray-500", "ring-4", "ring-emerald-100");
                circle.classList.add("bg-emerald-600", "text-white");
                circle.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i>`;
                label.classList.remove("text-gray-400", "text-emerald-900", "font-semibold");
                label.classList.add("text-emerald-700");
            } else {
                circle.classList.remove("bg-emerald-600", "bg-emerald-700", "text-white", "ring-4", "ring-emerald-100");
                circle.classList.add("bg-white", "text-gray-500", "border", "border-gray-200");
                circle.innerHTML = `${stepNum}`;
                label.classList.remove("text-emerald-900", "font-semibold", "text-emerald-700");
                label.classList.add("text-gray-400");
            }
        });

        // Mostrar sección correspondiente con fade suave
        stepContainers.forEach(container => {
            const stepNum = parseInt(container.dataset.step, 10);
            if (stepNum === targetStep) {
                container.classList.remove("hidden");
                container.classList.add("step-content-active");
            } else {
                container.classList.add("hidden");
                container.classList.remove("step-content-active");
            }
        });

        // Scroll suave al inicio del contenedor
        window.scrollTo({ top: 120, behavior: "smooth" });

        updateSelectionSummary();
        if (window.lucide) window.lucide.createIcons();
    }

    // Botones de flujo
    document.getElementById("btn-goto-step-2")?.addEventListener("click", () => goToStep(2));
    document.getElementById("btn-back-to-step-1")?.addEventListener("click", () => goToStep(1));
    
    document.getElementById("btn-goto-step-3")?.addEventListener("click", () => goToStep(3));
    document.getElementById("btn-back-to-step-2")?.addEventListener("click", () => goToStep(2));

    document.getElementById("btn-goto-step-4")?.addEventListener("click", () => goToStep(4));
    document.getElementById("btn-back-to-step-3")?.addEventListener("click", () => goToStep(3));

    // Permitir clics en la barra de pasos si ya se completaron los previos
    stepIndicators.forEach(ind => {
        ind.addEventListener("click", () => {
            const targetStep = parseInt(ind.dataset.step, 10);
            if (targetStep < state.currentStep) {
                goToStep(targetStep);
            }
        });
    });

    function validateStep2Button() {
        const btn = document.getElementById("btn-goto-step-3");
        if (btn) {
            if (state.selectedTime) {
                btn.removeAttribute("disabled");
                btn.classList.remove("opacity-50", "cursor-not-allowed");
            } else {
                btn.setAttribute("disabled", "true");
                btn.classList.add("opacity-50", "cursor-not-allowed");
            }
        }
    }

    // =========================================================================
    // INTEGRACIÓN Y DEMO DE PAYPHONE (PASO 4)
    // =========================================================================
    const payphoneModal = document.getElementById("payphone-modal");
    const btnOpenPayphone = document.getElementById("btn-pay-with-payphone");
    const btnClosePayphoneModal = document.getElementById("btn-close-payphone-modal");
    const btnSimulateSuccess = document.getElementById("btn-simulate-payphone-success");
    const btnDirectPayphoneLink = document.getElementById("btn-direct-payphone-link");
    const successScreen = document.getElementById("appointment-success-screen");

    // Al hacer clic en "Agendar y Pagar con Payphone"
    btnOpenPayphone?.addEventListener("click", () => {
        syncFormToState();
        if (!state.patientData.fullName || !state.patientData.email || !state.patientData.phone) {
            notify.error("Verifica tus datos", "Revisa tu nombre, correo o celular antes de continuar.");
            goToStep(3);
            return;
        }

        notify.info("Conectando con Payphone", "Preparando pasarela de pago seguro...");

        // Abrir modal interactivo de demostración de Payphone
        if (payphoneModal) {
            payphoneModal.classList.remove("hidden");
            payphoneModal.classList.add("flex");
            
            // Llenar datos de cobro en el modal
            const payphoneAmountDisplay = document.getElementById("payphone-modal-amount");
            if (payphoneAmountDisplay) {
                payphoneAmountDisplay.textContent = `$${APP_CONFIG.specialist.price.toFixed(2)} USD`;
            }
            const payphoneClientName = document.getElementById("payphone-modal-client");
            if (payphoneClientName) {
                payphoneClientName.textContent = state.patientData.fullName;
            }
            const payphoneClientPhone = document.getElementById("payphone-modal-phone");
            if (payphoneClientPhone) {
                payphoneClientPhone.textContent = state.patientData.phone;
            }
        }
    });

    // Cerrar modal de Payphone
    btnClosePayphoneModal?.addEventListener("click", () => {
        if (payphoneModal) {
            payphoneModal.classList.add("hidden");
            payphoneModal.classList.remove("flex");
        }
    });

    // Botón de redirección directa al link oficial de Payphone
    btnDirectPayphoneLink?.addEventListener("click", () => {
        const payphoneUrl = APP_CONFIG.payphone.paymentUrl;
        notify.info("Enlace de cobro", "Redirigiendo a la pasarela web de Payphone...");
        window.open(payphoneUrl, "_blank", "noopener,noreferrer");
    });

    // Simular pago exitoso en el Demo
    btnSimulateSuccess?.addEventListener("click", () => {
        const btn = btnSimulateSuccess;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Conectando con Payphone...`;
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            // Cerrar modal
            if (payphoneModal) {
                payphoneModal.classList.add("hidden");
                payphoneModal.classList.remove("flex");
            }
            // Restaurar texto del botón
            btn.innerHTML = `Simular Pago Aprobado en Payphone`;

            notify.success("¡Pago aprobado en Payphone!", "Tu cita psicológica ha sido confirmada con éxito.");

            // Mostrar pantalla de éxito
            showAppointmentSuccess();
        }, 1200);
    });

    function showAppointmentSuccess() {
        if (!successScreen) return;

        // Ocultar las 4 secciones
        stepContainers.forEach(c => c.classList.add("hidden"));
        document.getElementById("main-flow-container")?.classList.add("hidden");
        successScreen.classList.remove("hidden");

        const successCode = "CS-" + Math.floor(100000 + Math.random() * 900000);
        document.getElementById("success-code").textContent = successCode;
        document.getElementById("success-date").textContent = formatDisplayDate(state.selectedDate, true);
        document.getElementById("success-time").textContent = `${state.selectedTimeLabel || state.selectedTime} (50 min)`;
        document.getElementById("success-patient").textContent = state.patientData.fullName;
        document.getElementById("success-email").textContent = state.patientData.email;
        document.getElementById("success-modality").textContent = state.modality === "online" 
            ? "Videoconsulta Segura (Enlace enviado a tu email)"
            : "Presencial (Consultorio Psicología y Mente, Piso 3)";

        // Configurar botón de WhatsApp
        const waBtn = document.getElementById("btn-success-whatsapp");
        if (waBtn) {
            const message = encodeURIComponent(`Hola Dra. Valentina, acabo de agendar y pagar mi cita psicológica para el ${formatDisplayDate(state.selectedDate)} a las ${state.selectedTime}. Código: ${successCode}. Paciente: ${state.patientData.fullName}`);
            waBtn.href = `https://wa.me/593991234567?text=${message}`;
        }

        window.scrollTo({ top: 50, behavior: "smooth" });
        if (window.lucide) window.lucide.createIcons();
    }

    // Botón reiniciar demo
    document.getElementById("btn-reset-demo")?.addEventListener("click", () => {
        location.reload();
    });

    // =========================================================================
    // ELEMENTO DE CALMA Y BIENESTAR: MICRO-RESPIRACIÓN CONSCIENTE
    // =========================================================================
    const breathingBtn = document.getElementById("btn-toggle-breathe");
    const breathingModal = document.getElementById("breathing-modal");
    const closeBreathingModal = document.getElementById("btn-close-breathing");
    const breathingText = document.getElementById("breathing-phase-text");

    let breathingInterval = null;

    breathingBtn?.addEventListener("click", () => {
        if (breathingModal) {
            breathingModal.classList.remove("hidden");
            breathingModal.classList.add("flex");
            notify.default("Pausa consciente", "Respira suavemente siguiendo el compás del círculo.");
            startBreathingExercise();
        }
    });

    closeBreathingModal?.addEventListener("click", () => {
        if (breathingModal) {
            breathingModal.classList.add("hidden");
            breathingModal.classList.remove("flex");
            clearInterval(breathingInterval);
        }
    });

    function startBreathingExercise() {
        if (!breathingText) return;
        const phases = [
            { text: "Inhala profundamente por la nariz...", duration: 4000 },
            { text: "Sostén con calma y tranquilidad...", duration: 4000 },
            { text: "Exhala suavemente por la boca...", duration: 4000 },
            { text: "Descansa y siente la quietud...", duration: 2000 }
        ];
        let phaseIndex = 0;

        const cycle = () => {
            const current = phases[phaseIndex];
            breathingText.textContent = current.text;
            phaseIndex = (phaseIndex + 1) % phases.length;
        };

        cycle();
        clearInterval(breathingInterval);
        breathingInterval = setInterval(cycle, 3500);
    }

    // =========================================================================
    // INICIALIZACIÓN GENERAL
    // =========================================================================
    initDefaultDate();
    renderCalendar();
    renderTentativeDates();
    renderTimeSlots();
    updateSelectionSummary();

    if (window.lucide) {
        window.lucide.createIcons();
    }
});
