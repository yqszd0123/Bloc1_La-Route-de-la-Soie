(function initMaterialController(global) {
  'use strict';
  const app = global.AvelisApp;
  const fields = ['frameMaterial', 'timberSection', 'timberStudSpacingMm',
    'budgetPriceEurPerKgExVat', 'budgetLowEurPerKgExVat', 'budgetHighEurPerKgExVat',
    'timberBudgetPriceEurPerM3ExVat', 'timberBudgetLowEurPerM3ExVat', 'timberBudgetHighEurPerM3ExVat',
    'budgetPriceLabel', 'budgetPriceDate', 'budgetPriceSource'];

  function settings(form) {
    return Object.fromEntries(fields.map((name) => {
      const value = form.elements[name] ? form.elements[name].value : '';
      return [name, name.includes('Eur') || name === 'timberStudSpacingMm' ? (value === '' ? null : Number(value)) : value];
    }));
  }

  function sync(form) {
    const timber = form.elements.frameMaterial.value === 'TIMBER';
    document.body.dataset.material = timber ? 'TIMBER' : 'STEEL';
    document.querySelectorAll('[data-material-only]').forEach((el) => { el.hidden = el.dataset.materialOnly !== (timber ? 'TIMBER' : 'STEEL'); });
    document.getElementById('timber-door-base-field').hidden = !(timber && form.elements.timberReferenceId.value);
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    set('config-heading', timber ? 'Configurer une ossature bois' : 'Configurer un panneau acier');
    set('material-mode-note', timber ? 'Bois C24 · sections pleines · hypothèses de conception' : 'Acier formé à froid · profils C / rails U de référence');
    set('metric-budget-label', timber ? 'Budget bois (ossature)' : 'Budget matière');
    set('metric-material-label', timber ? 'Volume bois' : 'Masse acier');
    set('metric-material-note', timber ? 'm³ · section × longueur' : 'kg · longueur × kg/m fabricant');
    set('comparison-material-label', timber ? 'Volume / masse' : 'Masse');
    set('manufacturing-section-label', timber ? 'Largeur de section' : 'Épaisseur acier');
    set('manufacturing-quantity-label', timber ? 'Volume bois' : 'Surface développée');
    set('material-evidence-heading', timber ? 'Bois C24 de référence' : 'Produit acier de référence');
    set('material-priority-label', timber ? 'Volume de bois minimal' : 'Masse minimale');
    set('balanced-priority-label', timber ? 'Équilibre volume / pièces / longueurs' : 'Équilibre masse / pièces / longueurs');
    set('manufacturing-sequence-note', timber
      ? 'Ordre de préparation bois conceptuel : lisses basses, montants, encadrements, puis lisses hautes. Assemblages, fixations, tolérances et équipements à confirmer avec Avelis et le Bloc 2.'
      : 'Ordre proposé d’après FRAMECAD Detailer — Stick Order Assembly Priority (octobre 2025), sections 1.3–1.4 ; ouvertures multiples de gauche à droite. Aucun export RFY ni compatibilité machine Avelis revendiqué.');
    const rail = document.getElementById('material-reference');
    rail.innerHTML = timber
      ? '<h3>Références bois</h3><div class="reference-chip"><strong>Bois C24</strong><span>Masse indicative : 420 kg/m³ · Södra</span></div><div class="reference-chip"><strong>45 × 95 / 120 / 145 mm + 45 × 160 mm aux portes</strong><span>Sections Schilliger ; dimensions 145/160 et entraxe 625 mm transmis par Avelis</span></div><div class="reference-chip"><strong>Encadrements de baie</strong><span>Montants principaux, appuis, traverses et montants courts</span></div><div class="reference-chip"><strong>Budget de démonstration</strong><span>620 €/m³ HT · remplaçable par votre devis</span></div><p class="field-hint">Sections, entraxes et linteaux conceptuels à dimensionner selon les charges. Le prix par défaut est une hypothèse, pas un tarif fournisseur.</p>'
      : '<h3>Références acier</h3><div class="reference-chip"><strong>Acier Z275</strong><span>fy ≥ 450 N/mm² · produit Metsec de référence</span></div><div class="reference-chip"><strong>Profils C / rails U</strong><span>kg/m et géométrie issus du fabricant</span></div><div class="reference-chip"><strong>Module cible 600 mm</strong><span>Trois implantations · entraxes réels affichés</span></div><div class="reference-chip"><strong>Budget régional</strong><span>3,09 €/kg HT · fourchette 1,82–4,12</span></div><p class="field-hint">Produits publics de référence, non confirmés par Avelis.</p>';
  }

  function bind(form, onChange) {
    ['frameMaterial', 'timberSection', 'timberStudSpacingMm'].forEach((name) => {
      form.elements[name].addEventListener('change', () => { sync(form); onChange(); });
    });
    sync(form);
  }
  app.materialController = { settings, sync, bind };
})(window);
