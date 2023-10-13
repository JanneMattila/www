class Carousel {
    constructor(elementName, path, imageNamePrefix, imageCount) {
        console.log("Carousel constructor");
        this.path = path;
        this.imageNamePrefix = imageNamePrefix;

        console.log(this.imageNamePrefix);

        this.carousel = document.getElementById(elementName);

        this.isOpened = false;
        this.index = 0;
        this.images = [];
        this.imagesLoaded = 0;
        this.imagesToLoad = imageCount;
        this.historyEntryAdded = false;
    }

    start = () => {
        for (let i = 1; i <= this.imagesToLoad; i++) {
            const img = new Image();
            img.onload = function () {
                this.imagesLoaded++;
            };
            img.src = `${this.path}/${this.imageNamePrefix}-${i.toString().padStart(2, '0')}.png`;
            this.images[i] = img;
        }

        document.addEventListener('keyup', e => {
            if (e.key === "Escape") {
                this.isOpened = false;
                this.gotoFullscreen(this.isOpened);
            }
            else if (e.key === "Home" || e.key === "PageUp") {
                this.toImage(0);
            }
            else if (e.key === "ArrowLeft" && !e.altKey) {
                this.previousImage();
            }
            else if (e.key === "ArrowRight" && !e.altKey) {
                this.nextImage();
            }
            else if (e.key === "End" || e.key === "PageDown") {
                this.toImage(this.imagesToLoad - 1);
            }
        });

        window.addEventListener('popstate', e => {
            this.isOpened = false;
            this.gotoFullscreen(this.isOpened);
        });

        this.carousel.addEventListener("click", e => {
            if (this.imagesToLoad === 1) {
                this.isOpened = !this.isOpened;
                this.gotoFullscreen(this.isOpened);
                return
            }

            if (e.offsetX < e.target.width * 0.2) {
                this.previousImage();
            }
            else if (e.offsetX > e.target.width * 0.8) {
                this.nextImage();
            }
            else {
                this.isOpened = !this.isOpened;
                this.gotoFullscreen(this.isOpened);
            }
        });
    };

    gotoFullscreen = (isFullscreen) => {
        if (isFullscreen) {
            document.body.classList.add("fullscreen-body");
            this.carousel.classList.add("fullscreen");
            history.pushState({ "name": this.elementName }, "", location.href);
        }
        else {
            document.body.classList.remove("fullscreen-body");
            this.carousel.classList.remove("fullscreen");
            history.replaceState(null, "", location.href);
        }
    };

    toImage = (num) => {
        this.index = num;
        this.carousel.src = `${this.path}/${this.imageNamePrefix}-${(num + 1).toString().padStart(2, '0')}.png`;
    };

    previousImage = () => {
        this.index--;
        if (this.index < 0) {
            this.index = this.imagesToLoad - 1;
        }
        this.toImage(this.index);
    };

    nextImage = () => {
        this.index = (this.index + 1) % this.imagesToLoad;
        this.toImage(this.index);
    };
}