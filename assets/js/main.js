async function loadCommonParts() {
    const [header, footer] = await Promise.all([
        fetch('common/header.html').then(res => res.text()),
        fetch('common/footer.html').then(res => res.text()),
    ]);

    document.getElementById('header').innerHTML = header;
    document.getElementById('footer').innerHTML = footer;
}
