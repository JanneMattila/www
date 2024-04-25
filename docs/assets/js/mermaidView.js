class MermaidView {
    constructor(element, index) {
        this.element = element;
        this.elementName = "mermaid-" + index;;

        this.isOpened = false;
        this.historyEntryAdded = false;
    }

    start = () => {
        document.addEventListener('keyup', e => {
            if (e.key === "Escape") {
                this.isOpened = false;
                this.gotoFullscreen(this.isOpened);
            }
        });

        window.addEventListener('popstate', e => {
            this.isOpened = false;
            this.gotoFullscreen(this.isOpened);
        });

        this.element.addEventListener("click", e => {
            this.isOpened = !this.isOpened;
            this.gotoFullscreen(this.isOpened);
        });
    };

    gotoFullscreen = (isFullscreen) => {
        if (isFullscreen) {
            document.body.classList.add("fullscreen-body");
            this.element.classList.add("fullscreen-mermaid");
            history.pushState({ "name": this.elementName }, "", location.href);
        }
        else {
            document.body.classList.remove("fullscreen-body");
            this.element.classList.remove("fullscreen-mermaid");
            history.replaceState(null, "", location.href);
        }
    };
}
const mermaidElements = document.getElementsByClassName("mermaid");
for (let index = 0; index < mermaidElements.length; index++) {
    const mermaidElement = mermaidElements[index];
    const view = new MermaidView(mermaidElement, index);
    view.start();
}
