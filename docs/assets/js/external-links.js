const linkElements = document.querySelectorAll("a");

linkElements.forEach(linkElement => {
    if (linkElement.hostname != window.location.hostname) {
        linkElement.setAttribute('target', '_blank');
    }
});
