const codeElements = document.querySelectorAll("code");

codeElements.forEach(codeElement => {

    if (codeElement.classList != undefined && codeElement.classList.length > 0) {
        return;
    }

    // Add copy button
    const copyButton = document.createElement("button");
    copyButton.textContent = "📋";
    copyButton.type = "button";
    copyButton.classList.add("copy-button");
    codeElement.parentNode.insertBefore(copyButton, codeElement);

    copyButton.onclick = function () {
        let input = document.createElement("textarea");
        input.textContent = codeElement.textContent;
        document.body.appendChild(input);
        input.select();
        try {
            document.execCommand("copy");
        } catch (e) {
            console.error(e);
        }
        document.body.removeChild(input);
        copyButton.innerHTML = "📝";
        setTimeout(function () {
            copyButton.innerHTML = "📋";
        }, 300);
    };
});