(function () {
  class Lightbox {
    constructor(options = {}) {
      this.options = Object.assign(
        {
          animationDuration: 300,
          closeOnOverlayClick: true,
          onOpen: null,
          onClose: null,
          onNavigate: null,
        },
        options,
      );

      this.images = [];
      this.currentIndex = 0;
      this.isOpen = false;
      this.zoomLevel = 1;
      this.touchStartX = 0;
      this.touchEndX = 0;
      this.wheelTimer = null;
      this.preloadedImages = {};

      this.init();
    }

    init() {
      this.createStyles();
      this.createLightbox();
      this.bindEvents();
      this.updateTheme();
    }

    createStyles() {
      const style = document.createElement("style");
      style.textContent = `
        .lb-lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transition: opacity ${this.options.animationDuration}ms ease;
          pointer-events: none;
          z-index: 10000;
        }
        .lb-lightbox-overlay.active {
          pointer-events: auto;
          opacity: 1;
        }
        .lb-lightbox-content-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
        }
        .lb-lightbox-container {
          width: 100%;
          height: 100%;
          position: relative;
          transition: transform ${this.options.animationDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1);
          overflow: hidden;
        }
        .lb-lightbox-image-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }
        .lb-lightbox-image {
          max-width: 90%;
          max-height: 85vh;
          height: auto;
          object-fit: contain;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          transition: transform ${this.options.animationDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity ${this.options.animationDuration}ms ease;
          opacity: 0;
          cursor: grab;
        }
        .lb-lightbox-image:active {
          cursor: grabbing;
        }
        .lb-lightbox-nav, .lb-lightbox-close {
          position: absolute;
          background-color: var(--color-surface, rgba(255, 255, 255, 0.9));
          color: var(--color-text-primary, #333);
          border: 1px solid var(--color-border, rgba(0,0,0,0.1));
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          width: 48px;
          height: 48px;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: all 0.2s ease;
        }
        .lb-lightbox-nav:hover, .lb-lightbox-close:hover {
          transform: scale(1.1);
          background-color: var(--color-accent, #16C47F);
          color: var(--color-bg, #fff);
          border-color: var(--color-accent, #16C47F);
        }
        .lb-lightbox-prev {
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
        }
        .lb-lightbox-next {
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
        }
        .lb-lightbox-close {
          top: 20px;
          right: 20px;
          font-size: 28px;
        }
        .lb-lightbox-counter {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--color-surface, rgba(0, 0, 0, 0.7));
          color: var(--color-text-primary, #fff);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          z-index: 2;
          backdrop-filter: blur(10px);
        }
        @media (max-width: 768px) {
          .lb-lightbox-nav, .lb-lightbox-close {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
          .lb-lightbox-prev {
            left: 10px;
          }
          .lb-lightbox-next {
            right: 10px;
          }
          .lb-lightbox-close {
            top: 10px;
            right: 10px;
          }
          .lb-lightbox-image {
            max-width: 95%;
            max-height: 80vh;
          }
        }
      `;
      document.head.appendChild(style);
    }

    createLightbox() {
      this.overlay = document.createElement("div");
      this.overlay.className = "lb-lightbox-overlay";

      this.contentWrapper = document.createElement("div");
      this.contentWrapper.className = "lb-lightbox-content-wrapper";

      this.container = document.createElement("div");
      this.container.className = "lb-lightbox-container";

      this.imageWrapper = document.createElement("div");
      this.imageWrapper.className = "lb-lightbox-image-wrapper";

      this.image = document.createElement("img");
      this.image.className = "lb-lightbox-image";

      this.prevButton = document.createElement("button");
      this.prevButton.className = "lb-lightbox-nav lb-lightbox-prev";
      this.prevButton.innerHTML = "&#10094;";
      this.prevButton.setAttribute("aria-label", "上一张");

      this.nextButton = document.createElement("button");
      this.nextButton.className = "lb-lightbox-nav lb-lightbox-next";
      this.nextButton.innerHTML = "&#10095;";
      this.nextButton.setAttribute("aria-label", "下一张");

      this.closeButton = document.createElement("button");
      this.closeButton.className = "lb-lightbox-close";
      this.closeButton.innerHTML = "&times;";
      this.closeButton.setAttribute("aria-label", "关闭");

      this.counter = document.createElement("div");
      this.counter.className = "lb-lightbox-counter";

      this.imageWrapper.appendChild(this.image);
      this.container.appendChild(this.imageWrapper);
      this.contentWrapper.appendChild(this.container);
      this.contentWrapper.appendChild(this.prevButton);
      this.contentWrapper.appendChild(this.nextButton);
      this.contentWrapper.appendChild(this.closeButton);
      this.contentWrapper.appendChild(this.counter);

      this.overlay.appendChild(this.contentWrapper);
      document.body.appendChild(this.overlay);

      this.closeButton.addEventListener("click", this.close.bind(this));
    }

    bindEvents() {
      document.addEventListener(
        "click",
        this.handleImageClick.bind(this),
        true,
      );
      this.overlay.addEventListener(
        "click",
        this.handleOverlayClick.bind(this),
      );
      this.prevButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showPreviousImage();
      });
      this.nextButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showNextImage();
      });
      this.closeButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.close();
      });
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
      this.overlay.addEventListener("wheel", this.handleWheel.bind(this), {
        passive: false,
      });
      this.overlay.addEventListener(
        "touchstart",
        this.handleTouchStart.bind(this),
        { passive: true },
      );
      this.overlay.addEventListener(
        "touchmove",
        this.handleTouchMove.bind(this),
        { passive: true },
      );
      this.overlay.addEventListener(
        "touchend",
        this.handleTouchEnd.bind(this),
        { passive: true },
      );

      // Listen for theme changes
      const observer = new MutationObserver(() => {
        this.updateTheme();
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    }

    updateTheme() {
      const theme =
        document.documentElement.getAttribute("data-theme") || "dark";
      if (this.overlay) {
        this.overlay.setAttribute("data-theme", theme);
      }
    }

    handleImageClick(event) {
      const clickedImage = event.target.closest("img");
      if (clickedImage && !this.isOpen) {
        // Skip if clicking on non-article images (like avatars, logos)
        const isArticleImage =
          clickedImage.closest(".article-content") ||
          clickedImage.closest(".post-content") ||
          clickedImage.closest(".markdown-body");
        if (!isArticleImage) return;

        event.preventDefault();
        event.stopPropagation();

        // Get all images in the article
        const articleContainer = clickedImage.closest(
          ".article-content, .post-content, .markdown-body",
        );
        this.images = Array.from(articleContainer.querySelectorAll("img"));
        this.currentIndex = this.images.indexOf(clickedImage);
        this.open();
      }
    }

    handleOverlayClick(event) {
      if (event.target === this.overlay && this.options.closeOnOverlayClick) {
        this.close();
      }
    }

    handleKeyDown(event) {
      if (!this.isOpen) return;
      switch (event.key) {
        case "ArrowLeft":
          this.showPreviousImage();
          break;
        case "ArrowRight":
          this.showNextImage();
          break;
        case "Escape":
          this.close();
          break;
      }
    }

    handleWheel(event) {
      event.preventDefault();

      if (event.ctrlKey) {
        this.zoomLevel += event.deltaY > 0 ? -0.1 : 0.1;
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
        this.image.style.transform = `scale(${this.zoomLevel})`;
      } else {
        clearTimeout(this.wheelTimer);
        this.wheelTimer = setTimeout(() => {
          const delta = Math.sign(event.deltaY);
          if (delta > 0) {
            this.showNextImage();
          } else {
            this.showPreviousImage();
          }
        }, 50);
      }
    }

    handleTouchStart(event) {
      this.touchStartX = event.touches[0].clientX;
    }

    handleTouchMove(event) {
      this.touchEndX = event.touches[0].clientX;
    }

    handleTouchEnd() {
      const difference = this.touchStartX - this.touchEndX;
      if (Math.abs(difference) > 50) {
        difference > 0 ? this.showNextImage() : this.showPreviousImage();
      }
    }

    open() {
      this.isOpen = true;
      this.zoomLevel = 1;
      this.overlay.classList.add("active");
      this.showImage(this.images[this.currentIndex].src);
      document.body.style.overflow = "hidden";
      if (typeof this.options.onOpen === "function") {
        this.options.onOpen();
      }
    }

    close() {
      document.body.style.overflow = "";
      this.overlay.classList.remove("active");
      this.isOpen = false;
      this.zoomLevel = 1;
      this.image.style.transform = "scale(1)";
      this.clearPreloadedImages();
      if (typeof this.options.onClose === "function") {
        this.options.onClose();
      }
    }

    showPreviousImage() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.zoomLevel = 1;
        this.showImage(this.images[this.currentIndex].src);
      }
    }

    showNextImage() {
      if (this.currentIndex < this.images.length - 1) {
        this.currentIndex++;
        this.zoomLevel = 1;
        this.showImage(this.images[this.currentIndex].src);
      }
    }

    showImage(imgSrc) {
      this.image.style.opacity = "0";

      const newImage = new Image();
      newImage.src = imgSrc;

      newImage.onload = () => {
        this.image.src = imgSrc;
        this.image.style.transform = "scale(1)";
        setTimeout(() => {
          this.image.style.opacity = "1";
        }, 50);

        this.preloadImages();
        this.updateCounter();
        this.updateNavButtons();
      };

      newImage.onerror = () => {
        console.error("Failed to load image:", imgSrc);
      };
    }

    updateCounter() {
      this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    }

    updateNavButtons() {
      this.prevButton.style.display = this.currentIndex === 0 ? "none" : "flex";
      this.nextButton.style.display =
        this.currentIndex === this.images.length - 1 ? "none" : "flex";
    }

    preloadImages() {
      const preloadNext = this.currentIndex + 1;
      const preloadPrev = this.currentIndex - 1;

      if (
        preloadNext < this.images.length &&
        !this.preloadedImages[preloadNext]
      ) {
        this.preloadedImages[preloadNext] = new Image();
        this.preloadedImages[preloadNext].src = this.images[preloadNext].src;
      }

      if (preloadPrev >= 0 && !this.preloadedImages[preloadPrev]) {
        this.preloadedImages[preloadPrev] = new Image();
        this.preloadedImages[preloadPrev].src = this.images[preloadPrev].src;
      }
    }

    clearPreloadedImages() {
      Object.keys(this.preloadedImages).forEach((key) => {
        this.preloadedImages[key].src = "";
      });
      this.preloadedImages = {};
    }
  }

  window.Lightbox = Lightbox;

  document.addEventListener("DOMContentLoaded", () => {
    new Lightbox();
  });
})();
