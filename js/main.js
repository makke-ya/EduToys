// EduToys main.js

(function() {
    const EMPTY_STICKER_CATALOG = Object.freeze({
        stickers: [],
        gameStickerPools: {}
    });

    function getDefaultStickerState() {
        return {
            version: 1,
            earnedStickers: [],
            pages: [{ stickers: [] }]
        };
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    window.EduToys = window.EduToys || {};

    Object.assign(window.EduToys, {
        vueApp: null,
        pixiApp: null,

        audio: {
            bgm: null,
            seTap: null,
            seTransition: null,
            seSticker: null,
            sePage: null,
            initialized: false,

            init() {
                if (this.initialized || typeof window.Howl === 'undefined') {
                    return;
                }

                this.bgm = new window.Howl({ src: ['static/sounds/bgm/ゆったりお散歩.mp3'], loop: true, volume: 0.2 });
                this.seTap = new window.Howl({ src: ['static/sounds/system/決定1.mp3'], volume: 0.8 });
                this.seTransition = new window.Howl({ src: ['static/sounds/staging/短い音-フワ.mp3'], volume: 0.8 });
                this.seSticker = new window.Howl({ src: ['static/sounds/system/完了3.mp3'], volume: 0.78 });
                this.sePage = new window.Howl({ src: ['static/sounds/system/ページめくり1.mp3'], volume: 0.72 });
                this.initialized = true;
            },

            reset() {
                this.bgm = null;
                this.seTap = null;
                this.seTransition = null;
                this.seSticker = null;
                this.sePage = null;
                this.initialized = false;
            },

            playBGM() {
                if (!this.initialized) {
                    this.init();
                }

                if (this.bgm && !this.bgm.playing()) {
                    this.bgm.play();
                }
            },

            stopBGM() {
                if (this.bgm) {
                    this.bgm.stop();
                }
            },

            playSE(type) {
                if (!this.initialized) {
                    this.init();
                }

                if (type === 'tap' && this.seTap) {
                    this.seTap.play();
                }
                if (type === 'transition' && this.seTransition) {
                    this.seTransition.play();
                }
                if (type === 'sticker' && this.seSticker) {
                    this.seSticker.play();
                }
                if (type === 'page' && this.sePage) {
                    this.sePage.play();
                }
            }
        },

        showHome() {
            if (this.vueApp && typeof this.vueApp.showHome === 'function') {
                this.vueApp.showHome();
            }
        },

        showStickerBook() {
            if (this.vueApp && typeof this.vueApp.showStickerBook === 'function') {
                this.vueApp.showStickerBook();
            }
        },

        init() {
            if (!window.Vue) {
                console.error('Vue.js is not loaded.');
                return;
            }

            const App = {
                data() {
                    return {
                        isStarted: false,
                        currentView: 'home',
                        currentGameId: null,
                        games: [
                            { id: '001_count_tap', name: 'かぞえてたっぷ', category: 'かず', thumbnail: 'static/thumbnails/001_count_tap.jpg' }
                        ],
                        stickerCatalog: clone(EMPTY_STICKER_CATALOG),
                        stickerPages: [{ stickers: [] }],
                        availableStickerIds: [],
                        currentStickerPage: 0,
                        stickerCatalogError: '',
                        draggingSticker: null,
                        dragPointerId: null,
                        dragPreview: {
                            visible: false,
                            x: 0,
                            y: 0,
                            path: '',
                            name: ''
                        }
                    };
                },

                computed: {
                    stickerDefinitionMap() {
                        return Object.fromEntries(
                            (this.stickerCatalog.stickers || []).map((sticker) => [sticker.id, sticker])
                        );
                    },

                    stickerPageCount() {
                        return Math.max(this.stickerPages.length, 1);
                    },

                    placedStickers() {
                        const page = this.stickerPages[this.currentStickerPage] || { stickers: [] };

                        return page.stickers.map((sticker, index) => ({
                            ...sticker,
                            key: `${sticker.id}-${this.currentStickerPage}-${index}`,
                            ...(this.stickerDefinitionMap[sticker.id] || {
                                name: 'シール',
                                path: ''
                            })
                        }));
                    },

                    availableStickerEntries() {
                        return this.availableStickerIds.map((stickerId, index) => ({
                            id: stickerId,
                            key: `${stickerId}-${index}`,
                            ...(this.stickerDefinitionMap[stickerId] || {
                                name: 'シール',
                                path: ''
                            })
                        }));
                    },

                    dragPreviewStyle() {
                        return {
                            left: `${this.dragPreview.x}px`,
                            top: `${this.dragPreview.y}px`
                        };
                    }
                },

                mounted() {
                    window.addEventListener('pointermove', this.onGlobalPointerMove);
                    window.addEventListener('pointerup', this.onGlobalPointerUp);
                    window.addEventListener('pointercancel', this.onGlobalPointerCancel);
                },

                beforeUnmount() {
                    window.removeEventListener('pointermove', this.onGlobalPointerMove);
                    window.removeEventListener('pointerup', this.onGlobalPointerUp);
                    window.removeEventListener('pointercancel', this.onGlobalPointerCancel);
                },

                methods: {
                    startGame() {
                        this.isStarted = true;
                        window.EduToys.audio.playBGM();
                        window.EduToys.audio.playSE('transition');
                    },

                    playTap() {
                        window.EduToys.audio.playSE('tap');
                    },

                    playTransition() {
                        window.EduToys.audio.playSE('transition');
                    },

                    async syncStickerBookState() {
                        try {
                            if (window.EduToys.stickerBook && typeof window.EduToys.stickerBook.loadCatalog === 'function') {
                                this.stickerCatalog = await window.EduToys.stickerBook.loadCatalog();
                            } else {
                                this.stickerCatalog = clone(EMPTY_STICKER_CATALOG);
                            }
                            this.stickerCatalogError = '';
                        } catch (error) {
                            console.error('Failed to load sticker catalog:', error);
                            this.stickerCatalog = clone(EMPTY_STICKER_CATALOG);
                            this.stickerCatalogError = 'シールを よみこめなかったよ';
                        }

                        const storageState = window.EduToys.storage && typeof window.EduToys.storage.load === 'function'
                            ? window.EduToys.storage.load()
                            : getDefaultStickerState();

                        this.stickerPages = storageState.pages.length > 0 ? storageState.pages : [{ stickers: [] }];
                        this.availableStickerIds = window.EduToys.storage && typeof window.EduToys.storage.getAvailableStickers === 'function'
                            ? window.EduToys.storage.getAvailableStickers()
                            : [];

                        if (window.EduToys.stickerBook && typeof window.EduToys.stickerBook.clampPageIndex === 'function') {
                            this.currentStickerPage = window.EduToys.stickerBook.clampPageIndex(this.currentStickerPage, this.stickerPages.length);
                        } else {
                            this.currentStickerPage = Math.min(this.currentStickerPage, this.stickerPages.length - 1);
                        }
                    },

                    showHome() {
                        this.cancelStickerDrag();
                        this.playTransition();
                        window.EduToys.cleanupGame();
                        window.EduToys.audio.playBGM();
                        this.currentView = 'home';
                        this.currentGameId = null;
                    },

                    async showStickerBook() {
                        this.cancelStickerDrag();
                        this.playTransition();
                        window.EduToys.cleanupGame();
                        window.EduToys.audio.playBGM();
                        this.currentView = 'sticker_book';
                        this.currentGameId = null;
                        await this.syncStickerBookState();
                    },

                    loadGame(gameId) {
                        this.cancelStickerDrag();
                        this.playTap();
                        window.EduToys.audio.stopBGM();
                        this.currentView = 'game';
                        this.currentGameId = gameId;

                        this.$nextTick(() => {
                            window.EduToys.loadGame(gameId);
                        });
                    },

                    async changeStickerPage(step) {
                        if (step > 0 && this.currentStickerPage >= this.stickerPages.length - 1) {
                            const storageState = window.EduToys.storage.load();
                            storageState.pages.push({ stickers: [] });
                            window.EduToys.storage.save(storageState);
                            await this.syncStickerBookState();
                            this.currentStickerPage = this.stickerPages.length - 1;
                            window.EduToys.audio.playSE('page');
                            return;
                        }

                        const nextPage = window.EduToys.stickerBook && typeof window.EduToys.stickerBook.clampPageIndex === 'function'
                            ? window.EduToys.stickerBook.clampPageIndex(this.currentStickerPage + step, this.stickerPages.length)
                            : Math.max(0, Math.min(this.currentStickerPage + step, this.stickerPages.length - 1));

                        if (nextPage !== this.currentStickerPage) {
                            this.currentStickerPage = nextPage;
                            window.EduToys.audio.playSE('page');
                        }
                    },

                    startStickerDrag(sticker, event) {
                        if (!sticker || !event) {
                            return;
                        }

                        event.preventDefault();
                        if (event.currentTarget && typeof event.currentTarget.setPointerCapture === 'function') {
                            try {
                                event.currentTarget.setPointerCapture(event.pointerId);
                            } catch (error) {
                                // setPointerCapture can fail on some browsers; window listeners still handle drag.
                            }
                        }

                        this.draggingSticker = sticker;
                        this.dragPointerId = typeof event.pointerId === 'number' ? event.pointerId : null;
                        this.dragPreview = {
                            visible: true,
                            x: event.clientX,
                            y: event.clientY,
                            path: sticker.path,
                            name: sticker.name
                        };
                        window.EduToys.audio.playSE('tap');
                    },

                    onGlobalPointerMove(event) {
                        if (this.currentView !== 'sticker_book') {
                            return;
                        }

                        this.onStickerBookPointerMove(event);
                    },

                    onStickerBookPointerMove(event) {
                        if (!this.draggingSticker) {
                            return;
                        }

                        if (this.dragPointerId !== null && event.pointerId !== this.dragPointerId) {
                            return;
                        }

                        this.dragPreview = {
                            ...this.dragPreview,
                            visible: true,
                            x: event.clientX,
                            y: event.clientY
                        };
                    },

                    async onGlobalPointerUp(event) {
                        if (!this.draggingSticker) {
                            return;
                        }

                        if (this.currentView !== 'sticker_book') {
                            this.cancelStickerDrag();
                            return;
                        }

                        await this.onStickerBookPointerUp(event);
                    },

                    async onStickerBookPointerUp(event) {
                        if (!this.draggingSticker) {
                            return;
                        }

                        if (this.dragPointerId !== null && event.pointerId !== this.dragPointerId) {
                            return;
                        }

                        const sticker = this.draggingSticker;
                        const board = this.$refs.stickerBoard;
                        const point = board && window.EduToys.stickerBook
                            ? window.EduToys.stickerBook.pointToPercent(event.clientX, event.clientY, board)
                            : null;
                        const canPlace = board && window.EduToys.stickerBook
                            ? window.EduToys.stickerBook.isPointInsideElement(event.clientX, event.clientY, board)
                            : false;

                        this.cancelStickerDrag();

                        if (!canPlace || !point) {
                            return;
                        }

                        try {
                            const rotation = window.EduToys.stickerBook && typeof window.EduToys.stickerBook.randomRotation === 'function'
                                ? window.EduToys.stickerBook.randomRotation()
                                : 0;

                            window.EduToys.storage.addSticker(sticker.id, this.currentStickerPage, point.x, point.y, rotation);
                            window.EduToys.audio.playSE('sticker');
                            await this.syncStickerBookState();
                        } catch (error) {
                            console.error('Failed to place sticker:', error);
                        }
                    },

                    onGlobalPointerCancel() {
                        this.cancelStickerDrag();
                    },

                    cancelStickerDrag() {
                        this.draggingSticker = null;
                        this.dragPointerId = null;
                        this.dragPreview = {
                            visible: false,
                            x: 0,
                            y: 0,
                            path: '',
                            name: ''
                        };
                    },

                    placedStickerStyle(sticker) {
                        return {
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`
                        };
                    }
                }
            };

            this.vueApp = window.Vue.createApp(App).mount('#app');
        },

        async loadGame(gameId) {
            const uiContainer = document.getElementById('game-ui-container');
            const canvasContainer = document.getElementById('game-canvas-container');

            if (!uiContainer || !canvasContainer) {
                console.error('Game containers not found.');
                return;
            }

            try {
                const response = await fetch(`games/${gameId}/start.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load game HTML: ${response.status}`);
                }

                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                uiContainer.innerHTML = '';
                Array.from(doc.body.childNodes).forEach((node) => {
                    if (node.tagName !== 'SCRIPT') {
                        uiContainer.appendChild(node.cloneNode(true));
                    }
                });

                const scripts = doc.querySelectorAll('script');
                for (const script of scripts) {
                    const newScript = document.createElement('script');
                    if (script.src) {
                        const url = new URL(script.src, window.location.href);
                        url.searchParams.set('t', Date.now());
                        newScript.src = url.toString();
                    } else {
                        newScript.textContent = script.textContent;
                    }
                    document.body.appendChild(newScript);
                    newScript.dataset.gameScript = gameId;
                }
            } catch (error) {
                console.error('Error loading game:', error);
                alert('げーむの よみこみに しっぱいしたよ。');
                if (this.vueApp) {
                    this.showHome();
                }
            }
        },

        cleanupGame() {
            if (this.pixiApp) {
                try {
                    this.pixiApp.destroy(true, { children: true, texture: true, baseTexture: true });
                } catch (error) {
                    console.warn('PixiJS destroy error:', error);
                }
                this.pixiApp = null;
            }

            if (window.Howler) {
                window.Howler.unload();
            }
            this.audio.reset();

            if (window.gsap) {
                window.gsap.killTweensOf('*');
            }

            const scripts = document.querySelectorAll('script[data-game-script]');
            scripts.forEach((script) => script.remove());

            const uiContainer = document.getElementById('game-ui-container');
            if (uiContainer) {
                uiContainer.innerHTML = '';
            }

            const canvasContainer = document.getElementById('game-canvas-container');
            if (canvasContainer) {
                canvasContainer.innerHTML = '';
            }
        }
    });

    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            window.EduToys.init();
        });
    }
})();
