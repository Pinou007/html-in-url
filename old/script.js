// Fonction pour basculer l'affichage de l'éditeur
function toggleEditor() {
    const editorContainer = document.getElementById("editorContainer");
    editorContainer.classList.toggle("active");
    document.getElementById("codeInput").value = getHtmlFromUrl() || '';
}

// Fonction pour obtenir le code depuis l'URL
function getHtmlFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("code") ? decodeURIComponent(params.get("code")) : "";
}

// Fonction pour injecter le code saisi dans la zone de contenu
function executeCode() {
    const codeInput = document.getElementById("codeInput").value;
    const content = document.getElementById("content");

    window.history.replaceState(null, null, `?code=${encodeURIComponent(codeInput)}`);

    content.innerHTML = highlightSyntax(codeInput);

    if (/window.location|document.location/.test(codeInput)) {
        alert("Redirections et modifications de location sont désactivées.");
        return;
    }

    const scripts = content.getElementsByTagName("script");
    for (let script of scripts) {
        try {
            eval(script.innerHTML);
        } catch (error) {
            console.error("Erreur de script:", error);
        }
    }
}

// Fonction pour surligner la syntaxe du code
function highlightSyntax(code) {
    return code
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>') // Commentaires
        .replace(/(&lt;\/?[a-z][a-z0-9]*)(.*?)(&gt;)/gi, (match, p1, p2, p3) => {
            return `<span class="tag">${p1}</span><span class="attr">${p2}</span>${p3}`;
        }) // Balises et attributs
        .replace(/(&gt;)/g, '&gt;');
}

// Charger et exécuter le code de l'URL si présent
function loadCodeFromUrl() {
    const codeFromUrl = getHtmlFromUrl();
    if (codeFromUrl) {
        document.getElementById("editorContainer").classList.remove("active");
        document.getElementById("content").innerHTML = highlightSyntax(codeFromUrl);
        const scripts = document.getElementById("content").getElementsByTagName("script");
        for (let script of scripts) {
            try {
                eval(script.innerHTML);
            } catch (error) {
                console.error("Erreur de script:", error);
            }
        }
    } else {
        toggleEditor();
    }
}

// Charger le code à partir de l'URL lors du chargement de la page
window.onload = loadCodeFromUrl;
