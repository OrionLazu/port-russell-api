/**
 * @file Envoi des formulaires du tableau de bord vers l'API.
 *
 * Un formulaire HTML ne sait envoyer que GET ou POST. Ce script lit la méthode
 * (data-method) et l'adresse (data-endpoint) de chaque formulaire .api-form,
 * remplace les paramètres {champ} de l'adresse par la valeur saisie, puis envoie
 * les autres champs en JSON. Le cookie de session accompagne la requête.
 */
(function () {
  'use strict';

  /**
   * Construit l'adresse et le corps de la requête à partir du formulaire.
   *
   * @param {HTMLFormElement} form - Formulaire soumis.
   * @returns {{url: string, body: Object}} Adresse et données à envoyer.
   */
  function buildRequest(form) {
    const data = Object.fromEntries(new FormData(form));
    const url = form.dataset.endpoint.replace(/\{(\w+)\}/g, function (_match, key) {
      const value = String(data[key] || '').trim();
      delete data[key];
      return encodeURIComponent(value);
    });
    // Les champs laissés vides ne sont pas envoyés.
    Object.keys(data).forEach(function (key) {
      if (data[key] === '') delete data[key];
    });
    if (data.catwayNumber !== undefined) data.catwayNumber = Number(data.catwayNumber);
    return { url: url, body: data };
  }

  /**
   * Affiche le résultat d'un appel sous le formulaire.
   *
   * @param {HTMLOutputElement} output - Zone de résultat.
   * @param {boolean} ok - Succès ou échec.
   * @param {string} message - Message principal.
   * @param {Object} [payload] - Données renvoyées par l'API.
   */
  function showResult(output, ok, message, payload) {
    output.className = 'result ' + (ok ? 'result-ok' : 'result-error');
    output.textContent = '';
    const p = document.createElement('p');
    p.textContent = message;
    output.appendChild(p);
    if (payload) {
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(payload, null, 2);
      output.appendChild(pre);
    }
  }

  document.querySelectorAll('form.api-form').forEach(function (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (form.dataset.confirm && !window.confirm(form.dataset.confirm)) return;

      const output = form.querySelector('output');
      const button = form.querySelector('button[type="submit"]');
      const method = form.dataset.method;
      const request = buildRequest(form);

      button.disabled = true;
      try {
        const response = await fetch(request.url, {
          method: method,
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: method === 'DELETE' ? undefined : JSON.stringify(request.body),
        });
        const payload = await response.json().catch(function () { return null; });

        if (response.status === 401) {
          window.location.href = '/?erreur=session';
          return;
        }
        if (response.ok) {
          showResult(output, true, (payload && payload.message) || 'Opération réussie (' + method + ' ' + request.url + ').', payload);
          form.reset();
        } else {
          const details = payload && payload.details && payload.details.length ? ' ' + payload.details.join(' ') : '';
          showResult(output, false, ((payload && payload.error) || 'Erreur ' + response.status) + details);
        }
      } catch (error) {
        showResult(output, false, 'Le serveur est injoignable. Vérifiez votre connexion.');
      } finally {
        button.disabled = false;
      }
    });
  });
})();
