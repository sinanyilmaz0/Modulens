/**
 * Embedded browser IIFE for the HTML report (injected after bootstrap globals).
 */
export const REPORT_CLIENT_SCRIPT = `    (function() {
      var VALID_PAGES = ["overview","components","patterns","rules","structure","planner"];
      var PAGE_TITLE_KEYS = { overview: "overview.reportTitle", components: "nav.components", patterns: "nav.patterns", rules: "nav.rules", structure: "nav.structure", planner: "nav.refactorPlan" };
      var data = typeof window.__REPORT_DATA__ !== "undefined" ? window.__REPORT_DATA__ : {};
      var esc = function(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\\n\\r]+/g, " "); };

      function resolveRuleTitle(id) {
        if (!id) return "";
        var m = (window.__RULES_BY_ID__ || {})[id];
        return (m && m.title) ? m.title : id;
      }

      function getNested(obj, path) {
        var parts = path.split(".");
        var cur = obj;
        for (var i = 0; i < parts.length && cur; i++) cur = cur[parts[i]];
        return cur;
      }
      function updatePageTitle() {
        var pageId = window.__CURRENT_PAGE__ || "overview";
        var t = window.__TRANSLATIONS__;
        var key = PAGE_TITLE_KEYS[pageId] || PAGE_TITLE_KEYS.overview;
        var titleEl = document.getElementById("page-title");
        if (titleEl && t) {
          var val = getNested(t, key);
          if (val != null) titleEl.textContent = val;
        }
      }
      function showPage(pageId) {
        window.__CURRENT_PAGE__ = pageId;
        var pages = document.querySelectorAll(".dashboard-page");
        var links = document.querySelectorAll(".sidebar-nav a");
        for (var i = 0; i < pages.length; i++) pages[i].classList.remove("active");
        for (var j = 0; j < links.length; j++) links[j].classList.remove("active");
        var page = document.getElementById("page-" + pageId);
        var link = document.querySelector('.sidebar-nav a[data-page="' + pageId + '"]');
        if (page) page.classList.add("active");
        if (link) link.classList.add("active");
        updatePageTitle();
        var contentEl = document.querySelector(".content");
        if (contentEl) contentEl.scrollTop = 0;
        window.scrollTo(0, 0);
        requestAnimationFrame(function() {
          if (contentEl) contentEl.scrollTop = 0;
        });
        if (!page && !link) console.warn("[Modulens] showPage: target page or link not found for pageId:", pageId);
      }
      function getHashPage() {
        var fromData = document.body.getAttribute("data-initial-page");
        if (fromData && VALID_PAGES.indexOf(fromData) >= 0) return fromData;
        var hash = (window.location.hash || "#overview").slice(1);
        return VALID_PAGES.indexOf(hash) >= 0 ? hash : "overview";
      }
      function bindSidebarNavigation() {
        var sidebarNav = document.querySelector(".sidebar-nav");
        if (!sidebarNav) { console.warn("[Modulens] bindSidebarNavigation: .sidebar-nav not found"); return; }
        sidebarNav.addEventListener("click", function(e) {
          var link = e.target && e.target.closest ? e.target.closest("a[data-page]") : null;
          if (link && sidebarNav.contains(link)) {
            var pageId = link.getAttribute("data-page");
            if (pageId && VALID_PAGES.indexOf(pageId) >= 0) {
              e.preventDefault();
              e.stopPropagation();
              showPage(pageId);
              window.location.hash = pageId;
            }
          }
        }, true);
        window.addEventListener("hashchange", function() { showPage(getHashPage()); });
        showPage(getHashPage());
        var initialPage = document.body.getAttribute("data-initial-page");
        if (initialPage) {
          window.location.hash = initialPage;
          document.body.removeAttribute("data-initial-page");
        }
      }

      function fallbackCopy(text) {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) {}
        document.body.removeChild(ta);
        return ok;
      }
      function copyToClipboard(text, btn, successLabel, restoreLabel) {
        if (!text || !btn) return;
        var t = window.__TRANSLATIONS__;
        var copyFailedLabel = (t && t.actions && t.actions.copyFailed) || "Copy failed";
        var copyFailedAlert = (t && t.actions && t.actions.copyFailedAlert) || "Copy failed. Clipboard permission may be unavailable. Try selecting and copying manually.";
        function showSuccess() {
          btn.textContent = successLabel;
          btn.setAttribute("aria-label", successLabel);
          setTimeout(function() { btn.textContent = restoreLabel; btn.setAttribute("aria-label", restoreLabel || "Copy"); }, 1500);
        }
        function showError() {
          btn.textContent = copyFailedLabel;
          btn.setAttribute("aria-label", copyFailedLabel);
          setTimeout(function() { btn.textContent = restoreLabel; btn.setAttribute("aria-label", restoreLabel || "Copy"); }, 2500);
          if (typeof alert === "function") alert(copyFailedAlert);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(showSuccess).catch(function() {
            if (fallbackCopy(text)) showSuccess(); else showError();
          });
        } else {
          if (fallbackCopy(text)) showSuccess(); else showError();
        }
      }

      function getDetailEntry(path) {
        if (!path) return null;
        return data[path] || data[path.replace(/\\//g, "\\\\")] || data[path.replace(/\\\\/g, "/")];
      }
      function createFallbackEntry(path) {
        var parts = (path || "").split(/[/\\\\]/);
        var fileName = parts.length ? parts[parts.length - 1] : "Component";
        var className = fileName.replace(/\\.component\\.ts$/i, "").replace(/[-.]/g, " ");
        return { filePath: path || "", fileName: fileName, className: className, __fallback: true };
      }
      function buildComponentSubtitle(entry) {
        if (!entry) return "";
        var parts = [];
        if (entry.highestSeverity) parts.push(entry.highestSeverity);
        var domIssue = entry.dominantIssue;
        if (domIssue) {
          var fmt = getDrawerT("issues." + domIssue);
          parts.push(typeof fmt === "string" ? fmt : domIssue.replace(/_/g, " ").replace(/\\b\\w/g, function(c) { return c.toUpperCase(); }));
        }
        return parts.join(" · ");
      }
      var detailModalOverlay = document.getElementById("detail-modal-overlay");
      var detailModalBody = document.getElementById("detail-modal-body");
      var detailModalTitle = document.getElementById("detail-modal-title");
      var detailModalSubtitle = document.getElementById("detail-modal-subtitle");
      var detailModalBack = document.getElementById("detail-modal-back");
      var detailModalClose = document.getElementById("detail-modal-close");

      var detailStack = [];
      var currentDetail = null;
      var detailModalSourceContext = null;

      function openDetail(payload) {
        detailStack = [];
        currentDetail = payload;
        detailModalSourceContext = getHashPage();
        renderDetailModal();
      }
      function pushDetail(payload) {
        if (currentDetail) detailStack.push(currentDetail);
        currentDetail = payload;
        renderDetailModal();
      }
      function goBack() {
        if (detailStack.length === 0) return;
        currentDetail = detailStack.pop();
        renderDetailModal();
      }
      function closeDetailModal() {
        detailStack = [];
        currentDetail = null;
        detailModalSourceContext = null;
        if (detailModalOverlay) {
          detailModalOverlay.classList.remove("open");
          detailModalOverlay.setAttribute("aria-hidden", "true");
        }
        document.body.style.overflow = "";
        document.querySelectorAll(".structure-concern-card.selected").forEach(function(c){ c.classList.remove("selected"); });
      }

      function renderDetailModal() {
        if (!detailModalOverlay || !detailModalBody || !detailModalTitle) return;
        if (!currentDetail) { closeDetailModal(); return; }
        var payload = currentDetail;
        if (detailModalTitle) detailModalTitle.textContent = payload.title;
        if (detailModalSubtitle) {
          detailModalSubtitle.textContent = payload.subtitle || "";
          detailModalSubtitle.style.display = payload.subtitle ? "" : "none";
        }
        if (detailModalBack) detailModalBack.style.display = detailStack.length > 0 ? "" : "none";
        detailModalBody.innerHTML = renderDetailContent(payload);
        detailModalOverlay.classList.add("open");
        detailModalOverlay.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
      }
      function refreshComponentDetailModalIfOpen() {
        if (!currentDetail || currentDetail.type !== "component") return;
        if (!detailModalOverlay || !detailModalOverlay.classList.contains("open")) return;
        renderDetailModal();
      }

      document.addEventListener("click", function(e) {
        var btn = e.target && e.target.closest ? e.target.closest(".pattern-explore-btn") : null;
        if (btn) {
          var key = btn.getAttribute("data-pattern-key");
          if (key) {
            e.preventDefault();
            var patternData = typeof window.__PATTERN_DATA__ !== "undefined" ? window.__PATTERN_DATA__ : { patterns: {} };
            var pattern = patternData.patterns && patternData.patterns[key];
            var patternSubtitle = "Pattern";
            if (pattern && pattern.meta) {
              var m = pattern.meta;
              var parts = [(m.impactLevel || "").charAt(0).toUpperCase() + (m.impactLevel || "").slice(1) + " impact", m.count ? m.count + " components" : ""].filter(Boolean);
              if (m.topArea) parts.push("Most in " + m.topArea);
              patternSubtitle = parts.join(" · ") || "Pattern";
            }
            openDetail({ type: "pattern", id: key, title: pattern ? pattern.name : key, subtitle: patternSubtitle });
          }
        }
      });
      document.addEventListener("click", function(e) {
        var row = e.target && e.target.closest ? e.target.closest(".pattern-component-row, .feature-pattern-component-row-compact, .feature-pattern-candidate-row") : null;
        if (row) {
          var path = row.getAttribute("data-file-path");
          if (path) {
            e.preventDefault();
            var isInsideModal = detailModalBody && row.closest && row.closest("#detail-modal-body");
            var entry = getDetailEntry(path) || createFallbackEntry(path);
            var payload = { type: "component", id: path, title: entry.fileName || (entry.filePath && entry.filePath.split(/[/\\\\]/).pop()) || "Component", subtitle: buildComponentSubtitle(entry) };
            if (isInsideModal) pushDetail(payload); else openDetail(payload);
          }
        }
      });

      document.addEventListener("click", function(e) {
        var expandBtn = e.target && e.target.closest ? e.target.closest(".feature-pattern-card-expand-btn") : null;
        var header = e.target && e.target.closest ? e.target.closest(".feature-pattern-card-header") : null;
        var card = (expandBtn || header) && (expandBtn || header).closest ? (expandBtn || header).closest(".feature-pattern-card-collapsible") : null;
        if (card) {
          e.preventDefault();
          var body = card.querySelector(".feature-pattern-card-body");
          var btn = card.querySelector(".feature-pattern-card-expand-btn");
          if (body && btn) {
            var isHidden = body.style.display === "none";
            body.style.display = isHidden ? "" : "none";
            btn.textContent = isHidden ? "Collapse" : "Explore";
            card.setAttribute("aria-expanded", isHidden ? "true" : "false");
          }
        }
        var recommendedBtn = e.target && e.target.closest ? e.target.closest(".structure-recommended-concern") : null;
        if (recommendedBtn) {
          var recConcernType = recommendedBtn.getAttribute("data-concern-type");
          if (recConcernType) {
            e.preventDefault();
            var recCard = document.querySelector(".structure-concern-card[data-concern-type=\\"" + recConcernType + "\\"]");
            document.querySelectorAll(".structure-concern-card.selected").forEach(function(c){ c.classList.remove("selected"); });
            if (recCard) recCard.classList.add("selected");
            openDetail({ type: "structure", id: recConcernType, title: recommendedBtn.textContent || recConcernType, subtitle: "Structure Concern" });
          }
          return;
        }
        var structureCard = e.target && e.target.closest ? e.target.closest(".structure-concern-card") : null;
        if (structureCard && !(e.target && e.target.closest && e.target.closest(".structure-btn-inspect"))) {
          var concernType = structureCard.getAttribute("data-concern-type");
          var concernTitleEl = structureCard.querySelector(".structure-concern-title");
          if (concernType && concernTitleEl) {
            e.preventDefault();
            document.querySelectorAll(".structure-concern-card.selected").forEach(function(c){ c.classList.remove("selected"); });
            structureCard.classList.add("selected");
            openDetail({ type: "structure", id: concernType, title: concernTitleEl.textContent || concernType, subtitle: "Structure Concern" });
          }
        } else if (!structureCard) {
          var topActionableCard = e.target && e.target.closest ? e.target.closest(".top-actionable-rule-card") : null;
          if (topActionableCard) {
            e.preventDefault();
            var topRuleId = topActionableCard.getAttribute("data-rule-id");
            var topRuleTitle = topActionableCard.getAttribute("data-rule-title");
            if (topRuleId) openDetail({ type: "rule", id: topRuleId, title: topRuleTitle || resolveRuleTitle(topRuleId), subtitle: "Rule" });
          } else {
            var ruleExpandBtn = e.target && e.target.closest ? e.target.closest(".rule-card-expand-btn") : null;
            var ruleHeader = e.target && e.target.closest ? e.target.closest(".rule-card-header") : null;
            var ruleCard = (ruleExpandBtn || ruleHeader) && (ruleExpandBtn || ruleHeader).closest ? (ruleExpandBtn || ruleHeader).closest(".rule-card-compact") : null;
            if (ruleCard) {
              e.preventDefault();
              var ruleId = ruleCard.getAttribute("data-rule-id");
              var ruleTitle = ruleCard.getAttribute("data-rule-title");
              if (ruleId) openDetail({ type: "rule", id: ruleId, title: ruleTitle || resolveRuleTitle(ruleId), subtitle: "Rule" });
            }
          }
        }
      });

      bindSidebarNavigation();

      document.addEventListener("click", function(e) {
        var copyPathBtn = e.target && e.target.closest ? e.target.closest(".structure-path-copy, .drawer-path-copy") : null;
        if (copyPathBtn) {
          var path = copyPathBtn.getAttribute("data-path");
          var origText = copyPathBtn.textContent;
          var t = window.__TRANSLATIONS__;
          var copySuccessPathLabel = (t && t.actions && t.actions.copySuccessPath) || "File path copied";
          copyToClipboard(path, copyPathBtn, copySuccessPathLabel, origText);
          return;
        }
        var copyRefactorBtn = e.target && e.target.closest ? e.target.closest(".structure-copy-refactor-btn") : null;
        if (copyRefactorBtn) {
          var refactor = copyRefactorBtn.getAttribute("data-refactor") || "";
          var why = copyRefactorBtn.getAttribute("data-why") || "";
          var text = "Refactor: " + refactor + "\\n\\nWhy: " + why;
          var refactorOrigText = copyRefactorBtn.textContent;
          var t = window.__TRANSLATIONS__;
          var copySuccessRefactorLabel = (t && t.actions && t.actions.copySuccessRefactor) || "Recommendation copied";
          copyToClipboard(text, copyRefactorBtn, copySuccessRefactorLabel, refactorOrigText);
          return;
        }
        var copyStrategyBtn = e.target && e.target.closest ? e.target.closest(".pattern-copy-strategy-btn") : null;
        if (copyStrategyBtn) {
          var strategy = copyStrategyBtn.getAttribute("data-strategy") || "";
          var origText = copyStrategyBtn.textContent;
          var t = window.__TRANSLATIONS__;
          var copySuccessStrategyLabel = (t && t.actions && t.actions.copySuccessStrategy) || "Strategy copied";
          copyToClipboard(strategy, copyStrategyBtn, copySuccessStrategyLabel, origText);
          return;
        }
      });

      (function initStructureToolbar() {
        var listEl = document.getElementById("structure-concerns-list");
        var sortSelect = document.getElementById("structure-sort");
        var filterConfidence = document.getElementById("structure-filter-confidence");
        var filterImpact = document.getElementById("structure-filter-impact");
        if (!listEl) return;
        var cards = Array.from(listEl.querySelectorAll(".structure-concern-card"));
        function applyStructureFiltersAndSort() {
          var sortBy = sortSelect ? sortSelect.value : "impact";
          var confVal = filterConfidence ? filterConfidence.value : "";
          var impactVal = filterImpact ? filterImpact.value : "";
          var visible = cards.filter(function(c) {
            var matchConf = !confVal || (c.getAttribute("data-confidence") || "") === confVal;
            var matchImpact = !impactVal || (c.getAttribute("data-impact") || "") === impactVal;
            return matchConf && matchImpact;
          });
          var impactOrder = { high: 0, medium: 1, low: 2 };
          var confOrder = { high: 0, medium: 1, low: 2 };
          visible.sort(function(a, b) {
            if (sortBy === "impact") return (impactOrder[a.getAttribute("data-impact")] != null ? impactOrder[a.getAttribute("data-impact")] : 1) - (impactOrder[b.getAttribute("data-impact")] != null ? impactOrder[b.getAttribute("data-impact")] : 1);
            if (sortBy === "confidence") return (confOrder[a.getAttribute("data-confidence")] != null ? confOrder[a.getAttribute("data-confidence")] : 1) - (confOrder[b.getAttribute("data-confidence")] != null ? confOrder[b.getAttribute("data-confidence")] : 1);
            if (sortBy === "affected") return (parseInt(b.getAttribute("data-affected-count") || "0", 10) - parseInt(a.getAttribute("data-affected-count") || "0", 10));
            if (sortBy === "type") return (a.getAttribute("data-concern-type") || "").localeCompare(b.getAttribute("data-concern-type") || "");
            return 0;
          });
          cards.forEach(function(c){ c.style.display = visible.indexOf(c) >= 0 ? "" : "none"; });
          visible.forEach(function(c){ listEl.appendChild(c); });
        }
        if (sortSelect) sortSelect.addEventListener("change", applyStructureFiltersAndSort);
        if (filterConfidence) filterConfidence.addEventListener("change", applyStructureFiltersAndSort);
        if (filterImpact) filterImpact.addEventListener("change", applyStructureFiltersAndSort);
      })();

      function getConfidenceBucket(score) {
        if (score >= 0.7) return "high";
        if (score >= 0.4) return "medium";
        if (score >= 0.2) return "low";
        return "reviewNeeded";
      }
      function getConfidenceDisplayLabel(score) {
        var bucket = getConfidenceBucket(score);
        var t = window.__TRANSLATIONS__;
        var labels = t && t.confidenceLabels;
        if (labels && labels[bucket]) return labels[bucket];
        var defaults = { high: "High confidence", medium: "Review recommended", low: "Derived from code signals", reviewNeeded: "Best-effort classification" };
        return defaults[bucket] || bucket;
      }
      function getSignalDisplayLabel(signal, note) {
        var labels = window.__SIGNAL_DISPLAY_LABELS__ || {};
        return labels[signal] || note || (signal || "").replace(/-/g, " ").replace(/_/g, " ");
      }
      function renderConfidenceBadge(score, breakdown) {
        if (score == null) return "";
        var pct = Math.round((score || 0) * 100);
        var bucket = getConfidenceBucket(score);
        var displayLabel = getConfidenceDisplayLabel(score);
        var t = window.__TRANSLATIONS__;
        var tooltip = t && t.confidenceTooltips && t.confidenceTooltips[bucket] || t && t.confidenceHelpText || "";
        var titleAttr = tooltip ? " title=\\"" + esc(tooltip + "") + "\\"" : "";
        var badge = "<span class=\\"confidence-badge confidence-" + bucket + "\\"" + titleAttr + ">" + esc(displayLabel) + " (" + pct + "%)</span>";
        if (breakdown && breakdown.contributingSignals && breakdown.contributingSignals.length) {
          var signalsHtml = "";
          var matchedCount = 0;
          for (var i = 0; i < breakdown.contributingSignals.length; i++) {
            var s = breakdown.contributingSignals[i];
            if (s.matched) {
              matchedCount++;
              var signalLabel = getSignalDisplayLabel(s.signal || "", s.note || "");
              signalsHtml += "<li class=\\"contributing-signal matched\\"><span class=\\"signal-name\\">" + esc(signalLabel) + "</span>" + (s.note ? ": " + esc(s.note) : "") + "</li>";
            }
          }
          if (matchedCount >= 2 && signalsHtml) {
            badge += "<details class=\\"confidence-breakdown\\"><summary>Supporting signals</summary><p class=\\"confidence-breakdown-intro\\">These signals influenced the role/confidence score.</p><ul class=\\"contributing-signals\\">" + signalsHtml + "</ul></details>";
          }
        }
        return badge;
      }
      const issueSelect = document.getElementById("filter-issue-type");
      const severitySelect = document.getElementById("filter-severity");
      const sortSelect = document.getElementById("components-sort");
      const searchInput = document.getElementById("components-search");
      const pageSizeSelect = document.getElementById("components-page-size");
      const showHealthyCheckbox = document.getElementById("show-healthy-components");
      const paginationEl = document.getElementById("components-pagination");
      const paginationPrev = document.getElementById("pagination-prev");
      const paginationNext = document.getElementById("pagination-next");
      const paginationPages = document.getElementById("pagination-pages");
      const compareSelect = document.getElementById("filter-compare-diff");
      var currentPage = 0;

      function getSnapshotComparisons() {
        if (typeof window.__SNAPSHOT_COMPARISONS__ === "object" && window.__SNAPSHOT_COMPARISONS__ !== null) {
          return window.__SNAPSHOT_COMPARISONS__;
        }
        return {};
      }
      function baselineKeyFromHistoryIndex(idx) {
        var hist = Array.isArray(window.__SNAPSHOT_HISTORY__) ? window.__SNAPSHOT_HISTORY__ : [];
        var s = hist[idx];
        if (!s) return null;
        if (s.snapshotHash) return s.snapshotHash;
        if (s.runId) return s.runId;
        return null;
      }
      function compareImpactScoreJs(ch) {
        var rank = { worsened: 100, newlyFlagged: 90, issueChanged: 70, improved: 50, resolved: 30, unchanged: 0 };
        var base = rank[ch.changeType] != null ? rank[ch.changeType] : 0;
        var dw = Math.abs((ch.currentWarningCount || 0) - (ch.previousWarningCount || 0));
        return base * 1000 + dw;
      }
      function badgeKindFromChangeType(ct) {
        if (ct === "newlyFlagged") return "new";
        if (ct === "resolved") return "resolved";
        if (ct === "worsened") return "worse";
        if (ct === "improved") return "better";
        if (ct === "issueChanged") return "changed";
        return null;
      }
      if (typeof window.__activeCompareContext__ === "undefined") window.__activeCompareContext__ = null;
      function formatProjectShortName(sourceRoot) {
        if (!sourceRoot) return "";
        var s = String(sourceRoot);
        var t = s;
        if (t.indexOf("projects/") === 0) t = t.slice(9);
        else if (t.indexOf("libs/") === 0) t = t.slice(5);
        else if (t.indexOf("apps/") === 0) t = t.slice(5);
        if (t.length > 4 && t.slice(-4) === "/src") t = t.slice(0, -4);
        return t || s;
      }
      window.__formatProjectShortName__ = formatProjectShortName;
      function ensureActiveCompareContext() {
        var baselineMap = window.__baselineBySourceRoot__ || {};
        var keys = [];
        for (var k in baselineMap) {
          if (Object.prototype.hasOwnProperty.call(baselineMap, k) && baselineMap[k] != null && baselineMap[k] !== undefined) keys.push(k);
        }
        keys.sort();
        if (keys.length === 0) {
          window.__activeCompareContext__ = null;
          return;
        }
        var cur = window.__activeCompareContext__;
        if (cur && keys.indexOf(cur.sourceRoot) >= 0) return;
        window.__activeCompareContext__ = { sourceRoot: keys[0], historyIndex: baselineMap[keys[0]] };
      }
      window.__ensureActiveCompareContext__ = ensureActiveCompareContext;
      function getActiveCompareSourceRoot() {
        var ctx = window.__activeCompareContext__;
        return ctx && ctx.sourceRoot ? ctx.sourceRoot : null;
      }
      function findProjectCardEl(sourceRoot) {
        if (!sourceRoot) return null;
        var nodes = document.querySelectorAll("[data-project-card-source]");
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].getAttribute("data-project-card-source") === sourceRoot) return nodes[i];
        }
        return null;
      }
      function getProjectDisplayNameFromCard(sourceRoot) {
        var card = findProjectCardEl(sourceRoot);
        if (!card) return null;
        var nameEl = card.querySelector(".project-name");
        if (!nameEl) return null;
        var text = (nameEl.textContent || "").trim();
        return text || null;
      }
      function syncCompareActiveCardHighlight() {
        var cards = document.querySelectorAll(".project-breakdown-card[data-project-card-source]");
        for (var ci = 0; ci < cards.length; ci++) {
          cards[ci].classList.remove("project-breakdown-card--compare-active");
        }
        ensureActiveCompareContext();
        var activeSr = getActiveCompareSourceRoot();
        if (!activeSr) return;
        var bm = window.__baselineBySourceRoot__ || {};
        if (bm[activeSr] == null || bm[activeSr] === undefined) return;
        var activeCard = findProjectCardEl(activeSr);
        if (activeCard) activeCard.classList.add("project-breakdown-card--compare-active");
      }
      function updateCompareFilterControlState() {
        var el = document.getElementById("filter-compare-diff");
        if (!el) return;
        var baselineMap = window.__baselineBySourceRoot__ || {};
        var any = false;
        for (var k in baselineMap) {
          if (Object.prototype.hasOwnProperty.call(baselineMap, k) && baselineMap[k] != null && baselineMap[k] !== undefined) {
            any = true;
            break;
          }
        }
        el.disabled = !any;
        if (!any) el.value = "all";
        var tFil = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.filters;
        var hintOn = (tFil && tFil.compareFilterHelper) || "";
        var hintOff = (tFil && tFil.compareFilterDisabledHint) || "Choose a baseline from a project card first.";
        var baseLbl = (tFil && tFil.compareBaseline) || "Compare vs baseline";
        el.title = any ? hintOn : hintOff;
        el.setAttribute("aria-label", any ? baseLbl + (hintOn ? ". " + hintOn : "") : hintOff);
      }
      function updateExplorerBaselineBar() {
        var bar = document.getElementById("components-explorer-baseline-bar");
        var projectLine = document.getElementById("components-explorer-baseline-project-line");
        var snapshotLine = document.getElementById("components-explorer-baseline-snapshot-line");
        var summaryEl = document.getElementById("components-explorer-baseline-summary");
        var legacyText = document.getElementById("components-explorer-baseline-legacy-text");
        var clearBtn = document.getElementById("components-explorer-baseline-clear");
        var changeBtn = document.getElementById("components-explorer-baseline-change");
        if (!bar) return;
        ensureActiveCompareContext();
        var baselineMap = window.__baselineBySourceRoot__ || {};
        var hist = Array.isArray(window.__SNAPSHOT_HISTORY__) ? window.__SNAPSHOT_HISTORY__ : [];
        var anyBaseline = false;
        for (var kb in baselineMap) {
          if (Object.prototype.hasOwnProperty.call(baselineMap, kb) && baselineMap[kb] != null && baselineMap[kb] !== undefined) {
            anyBaseline = true;
            break;
          }
        }
        if (!anyBaseline) {
          bar.hidden = true;
          bar.classList.remove("components-explorer-baseline-bar--active");
          if (clearBtn) clearBtn.hidden = true;
          if (changeBtn) changeBtn.hidden = true;
          if (projectLine) projectLine.textContent = "";
          if (snapshotLine) snapshotLine.textContent = "";
          if (summaryEl) summaryEl.textContent = "";
          if (legacyText) legacyText.textContent = "";
          syncCompareActiveCardHighlight();
          return;
        }
        var activeSr = getActiveCompareSourceRoot();
        if (!activeSr) {
          bar.hidden = true;
          bar.classList.remove("components-explorer-baseline-bar--active");
          if (clearBtn) clearBtn.hidden = true;
          if (changeBtn) changeBtn.hidden = true;
          syncCompareActiveCardHighlight();
          return;
        }
        var idxBar = baselineMap[activeSr];
        var snap = idxBar != null && idxBar !== undefined ? hist[idxBar] : null;
        var dateStr = "—";
        if (snap && snap.generatedAt) {
          try { dateStr = new Date(snap.generatedAt).toLocaleString(); } catch (eBar) {}
        }
        var tComp = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.components;
        var projTpl = (tComp && tComp.explorerBaselineComparingProject) || "Comparing project: {project}";
        var snapTpl = (tComp && tComp.explorerBaselineSnapshotLabel) || "Baseline snapshot: {date}";
        var sumTpl = (tComp && tComp.explorerBaselineSummaryShort) || "{resolved} resolved · {worsened} worsened · {improved} improved";
        var displayName = getProjectDisplayNameFromCard(activeSr) || formatProjectShortName(activeSr);
        if (projectLine) {
          var pt = projectLine.getAttribute("data-template-project") || projTpl;
          projectLine.textContent = pt.replace("{project}", displayName);
        }
        if (snapshotLine) {
          var st = snapshotLine.getAttribute("data-template-snapshot") || snapTpl;
          snapshotLine.textContent = st.replace("{date}", dateStr);
        }
        var compsB = getSnapshotComparisons();
        var bkeyB = idxBar != null && idxBar !== undefined ? baselineKeyFromHistoryIndex(idxBar) : null;
        var payloadB = bkeyB ? compsB[bkeyB] : null;
        var pcB = payloadB && payloadB.projectComparisons ? payloadB.projectComparisons[activeSr] : null;
        if (summaryEl) {
          if (pcB) {
            summaryEl.textContent = sumTpl
              .replace("{resolved}", String(pcB.resolvedCount != null ? pcB.resolvedCount : 0))
              .replace("{worsened}", String(pcB.worsenedCount != null ? pcB.worsenedCount : 0))
              .replace("{improved}", String(pcB.improvedCount != null ? pcB.improvedCount : 0));
          } else {
            summaryEl.textContent = (window.__TRANSLATIONS__ && window.__TRANSLATIONS__.empty && window.__TRANSLATIONS__.empty.noCompareDataForBaseline) || "";
          }
        }
        if (legacyText) {
          legacyText.textContent = "";
          legacyText.hidden = true;
        }
        bar.hidden = false;
        bar.classList.add("components-explorer-baseline-bar--active");
        if (clearBtn) clearBtn.hidden = false;
        if (changeBtn) changeBtn.hidden = false;
        syncCompareActiveCardHighlight();
      }

      function syncExplorerCompare() {
        var listWrap = document.getElementById("components-explorer-list-wrap");
        if (!listWrap) return;
        var rows = listWrap.querySelectorAll(".component-explorer-row");
        var comps = getSnapshotComparisons();
        var baselineMap = window.__baselineBySourceRoot__ || {};
        var tComp = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.components;
        var lbl = {
          new: (tComp && tComp.compareBadgeNew) || "New",
          resolved: (tComp && tComp.compareBadgeResolved) || "Resolved",
          worse: (tComp && tComp.compareBadgeWorse) || "Worse",
          better: (tComp && tComp.compareBadgeBetter) || "Better",
          changed: (tComp && tComp.compareBadgeChanged) || "Changed"
        };
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var slot = row.querySelector("[data-compare-badges-slot]");
          var sr = row.getAttribute("data-source-root") || row.getAttribute("data-project") || "";
          var ck = row.getAttribute("data-component-key") || "";
          var idx = baselineMap[sr];
          var bkey = idx != null && idx !== undefined ? baselineKeyFromHistoryIndex(idx) : null;
          var payload = bkey ? comps[bkey] : null;
          var pc = payload && payload.projectComparisons ? payload.projectComparisons[sr] : null;
          var diff = pc && pc.componentChangesByKey && ck ? pc.componentChangesByKey[ck] : null;
          if (slot) {
            if (!diff) {
              slot.innerHTML = "";
            } else {
              var kind = badgeKindFromChangeType(diff.changeType);
              var text = kind ? lbl[kind] : "";
              if (kind) {
                slot.innerHTML = "<span class=\\"explorer-compare-badge explorer-compare-badge-" + kind + "\\">" + esc(text) + "</span>";
              } else {
                slot.innerHTML = "";
              }
            }
          }
          if (diff) {
            var imp = compareImpactScoreJs(diff);
            row.setAttribute("data-compare-impact", String(imp));
            var pw = diff.previousWarningCount || 0;
            var cw = diff.currentWarningCount || 0;
            row.setAttribute("data-compare-wdelta", String(cw - pw));
            row.setAttribute("data-compare-bdelta", String(pw - cw));
            row.setAttribute("data-compare-kind", badgeKindFromChangeType(diff.changeType) || "");
          } else {
            row.removeAttribute("data-compare-impact");
            row.removeAttribute("data-compare-wdelta");
            row.removeAttribute("data-compare-bdelta");
            row.removeAttribute("data-compare-kind");
          }
        }
        updateCompareFilterControlState();
        updateExplorerBaselineBar();
        applyComponentsExplorerFilters();
        refreshComponentDetailModalIfOpen();
      }
      window.__syncExplorerCompare = syncExplorerCompare;

      function applyComponentsExplorerFilters() {
        var listWrap = document.getElementById("components-explorer-list-wrap");
        var emptyEl = document.getElementById("components-explorer-empty");
        if (!listWrap) return;
        var rows = Array.from(listWrap.querySelectorAll(".component-explorer-row"));
        var problematicCount = rows.filter(function(r) {
          var i = r.getAttribute("data-issue-type") || "";
          var wc = parseInt(r.getAttribute("data-warning-count") || "0", 10) || 0;
          var sev = r.getAttribute("data-severity") || "";
          var elevated = sev === "WARNING" || sev === "HIGH" || sev === "CRITICAL";
          if (elevated || wc > 0) return true;
          return i !== "" && i !== "NO_DOMINANT_ISSUE";
        }).length;
        var healthyCount = rows.length - problematicCount;
        var issueType = issueSelect?.value || "all";
        var severity = severitySelect?.value || "all";
        var search = (searchInput?.value || "").trim().toLowerCase();
        var pageSize = parseInt(pageSizeSelect?.value || "25", 10) || 25;
        var ruleFilterEl = document.getElementById("filter-rule-id");
        var ruleFilter = ruleFilterEl ? (ruleFilterEl.value || "").trim() : "";
        var structureFilterEl = document.getElementById("filter-structure-concern");
        var structureFilter = structureFilterEl ? (structureFilterEl.value || "").trim() : "";
        var projectFilterEl = document.getElementById("filter-project");
        var projectFilter = projectFilterEl ? (projectFilterEl.value || "").trim() : "";
        var structurePaths = (structureFilter && window.__STRUCTURE_TO_PATHS__ && window.__STRUCTURE_TO_PATHS__[structureFilter]) ? window.__STRUCTURE_TO_PATHS__[structureFilter] : null;
        var structurePathSet = structurePaths ? new Set(structurePaths.map(function(p){ return (p || "").replace(/\\\\/g, "/"); })) : null;

        var showHealthy = showHealthyCheckbox ? showHealthyCheckbox.checked : false;
        ensureActiveCompareContext();
        var compareFilter = compareSelect && !compareSelect.disabled ? (compareSelect.value || "all") : "all";
        var activeSourceRoot = getActiveCompareSourceRoot();
        function matchCompareFilter(row) {
          if (!compareSelect || compareSelect.disabled) return true;
          var itemProject = row.getAttribute("data-source-root") || row.getAttribute("data-project") || "";
          var baselineMap = window.__baselineBySourceRoot__ || {};
          var compsF = getSnapshotComparisons();
          if (!activeSourceRoot) return true;
          if (itemProject !== activeSourceRoot) return false;
          var idxF = baselineMap[activeSourceRoot];
          var bkeyF = idxF != null && idxF !== undefined ? baselineKeyFromHistoryIndex(idxF) : null;
          var payloadF = bkeyF ? compsF[bkeyF] : null;
          var hasPayload = !!(bkeyF && payloadF);
          var hasDiff = row.hasAttribute("data-compare-impact");
          var kind = row.getAttribute("data-compare-kind") || "";
          if (compareFilter === "all") return true;
          if (!hasPayload) return false;
          if (compareFilter === "changed-only") return hasDiff;
          if (!hasDiff) return false;
          if (compareFilter === "worse") return kind === "worse";
          if (compareFilter === "better") return kind === "better";
          if (compareFilter === "resolved") return kind === "resolved";
          if (compareFilter === "new") return kind === "new";
          if (compareFilter === "issue-changed") return kind === "changed";
          return false;
        }
        function filterRow(row) {
          var itemIssue = row.getAttribute("data-issue-type") || "";
          var itemSeverity = row.getAttribute("data-severity") || "";
          var itemSearch = row.getAttribute("data-search") || "";
          var itemProject = row.getAttribute("data-source-root") || row.getAttribute("data-project") || "";
          var itemRuleIds = (row.getAttribute("data-rule-ids") || "").trim().split(/\\s+/).filter(Boolean);
          var itemPath = (row.getAttribute("data-file-path") || "").replace(/\\\\/g, "/");
          var matchIssue = !issueType || issueType === "all" || itemIssue.split(/\\s+/).includes(issueType);
          var matchSeverity = !severity || severity === "all" || !itemSeverity || itemSeverity === severity;
          var matchSearch = !search || itemSearch.indexOf(search) >= 0;
          var matchProject = !projectFilter || itemProject === projectFilter;
          var matchRule = !ruleFilter || itemRuleIds.indexOf(ruleFilter) >= 0;
          var matchStructure = !structurePathSet || structurePathSet.has(itemPath);
          var warnCount = parseInt(row.getAttribute("data-warning-count") || "0", 10) || 0;
          var elevatedSev = itemSeverity === "WARNING" || itemSeverity === "HIGH" || itemSeverity === "CRITICAL";
          var isHealthy = (itemIssue === "" || itemIssue === "NO_DOMINANT_ISSUE") && warnCount === 0 && !elevatedSev;
          var matchHealthy = showHealthy || !isHealthy || issueType === "NO_DOMINANT_ISSUE";
          return matchIssue && matchSeverity && matchSearch && matchProject && matchHealthy && matchRule && matchStructure && matchCompareFilter(row);
        }

        var visibleRows = rows.filter(filterRow);
        var totalVisible = visibleRows.length;
        var criticalCount = visibleRows.filter(function(r) { return r.getAttribute("data-severity") === "CRITICAL"; }).length;
        var highCount = visibleRows.filter(function(r) { return r.getAttribute("data-severity") === "HIGH"; }).length;
        var totalPages = Math.max(1, Math.ceil(totalVisible / pageSize));
        if (currentPage >= totalPages) currentPage = Math.max(0, totalPages - 1);
        var startIdx = currentPage * pageSize;
        var endIdx = Math.min(startIdx + pageSize, totalVisible);

        rows.forEach(function(row) {
          var idx = visibleRows.indexOf(row);
          if (idx < 0) {
            row.style.display = "none";
          } else {
            row.style.display = (idx >= startIdx && idx < endIdx) ? "" : "none";
          }
        });

        if (emptyEl) emptyEl.style.display = totalVisible === 0 ? "block" : "none";
        listWrap.style.display = totalVisible === 0 ? "none" : "";
        if (paginationEl) paginationEl.style.display = totalVisible === 0 ? "none" : "flex";

        var searchMatchEl = document.getElementById("components-search-match-count");
        var searchClearBtn = document.getElementById("components-search-clear");
        var tCompMc = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.components;
        var matchTpl = (tCompMc && tCompMc.searchMatchCount) || "{count} matches";
        if (searchMatchEl) {
          if (search) {
            searchMatchEl.textContent = matchTpl.replace("{count}", String(totalVisible));
            searchMatchEl.style.display = "block";
          } else {
            searchMatchEl.textContent = "";
            searchMatchEl.style.display = "none";
          }
        }
        if (searchClearBtn) {
          searchClearBtn.hidden = !search;
        }
        var emptyTitle = document.getElementById("components-explorer-empty-title");
        var emptyHint = document.getElementById("components-explorer-empty-hint");
        var tEmptyDyn = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.empty;
        if (emptyTitle && emptyHint && tEmptyDyn && totalVisible === 0) {
          var compareFilterActive =
            compareSelect && !compareSelect.disabled && compareFilter && compareFilter !== "all";
          var compareScopeActive = compareSelect && !compareSelect.disabled && activeSourceRoot;
          if (compareFilterActive && tEmptyDyn.noComparedComponentsFilter) {
            emptyTitle.textContent = tEmptyDyn.noComparedComponentsFilter;
            emptyHint.textContent = (tEmptyDyn.noCompareFilterHint) || "";
          } else if (compareFilterActive && tEmptyDyn.noCompareFilterResults) {
            emptyTitle.textContent = tEmptyDyn.noCompareFilterResults;
            emptyHint.textContent = (tEmptyDyn.noCompareFilterHint) || "";
          } else if (
            !search &&
            compareScopeActive &&
            compareFilter === "all" &&
            (issueType === "all" || !issueType) &&
            (severity === "all" || !severity) &&
            !structureFilter &&
            !ruleFilter &&
            !projectFilter &&
            showHealthy &&
            tEmptyDyn.noCompareProjectScope
          ) {
            emptyTitle.textContent = tEmptyDyn.noCompareProjectScope;
            emptyHint.textContent = (tEmptyDyn.noMatchFiltersHint) || "";
          } else if (search) {
            if (tEmptyDyn.noMatchSearch) emptyTitle.textContent = tEmptyDyn.noMatchSearch;
            var hasOtherFilters = (issueType && issueType !== "all") || (severity && severity !== "all") || !!structureFilter || !!ruleFilter || !!projectFilter || !showHealthy;
            if (hasOtherFilters && tEmptyDyn.noMatchCombinedHint) emptyHint.textContent = tEmptyDyn.noMatchCombinedHint;
            else if (tEmptyDyn.noMatchSearchHint) emptyHint.textContent = tEmptyDyn.noMatchSearchHint;
          } else {
            if (tEmptyDyn.noMatchFilters) emptyTitle.textContent = tEmptyDyn.noMatchFilters;
            if (tEmptyDyn.noMatchFiltersHint) emptyHint.textContent = tEmptyDyn.noMatchFiltersHint;
          }
        }

        var primEl = document.getElementById("components-summary-primary");
        var secEl = document.getElementById("components-summary-secondary");
        if (rows.length > 0 && (primEl || secEl)) {
          var tCompSm = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.components;
          var sortLabelSm = sortSelect && sortSelect.options[sortSelect.selectedIndex] ? sortSelect.options[sortSelect.selectedIndex].text : "Highest risk";
          var listTotal = rows.length;
          var workspaceTotalRaw = listWrap.getAttribute("data-total-components");
          var workspaceTotal = workspaceTotalRaw ? parseInt(workspaceTotalRaw, 10) : NaN;
          if (isNaN(workspaceTotal)) workspaceTotal = null;
          var showingStart = totalVisible > 0 ? startIdx + 1 : 0;
          var showingEnd = totalVisible > 0 ? endIdx : 0;
          var primaryEmpty = (tCompSm && tCompSm.summaryPrimaryEmpty) || "No components match the current search and filters.";
          var primaryRange = (tCompSm && tCompSm.summaryPrimaryRange) || "Showing {start}–{end} of {matching} matching · {listTotal} in this list";
          var workspaceSeg = (tCompSm && tCompSm.summaryWorkspaceSegment) || " · {workspaceTotal} in workspace";
          var secondarySorted = (tCompSm && tCompSm.summarySecondarySorted) || "Sorted by {sortLabel}.";
          var secondaryHealthyHidden = (tCompSm && tCompSm.summarySecondaryHealthyHidden) || "{count} without a ranked primary issue hidden from this list.";
          var secondarySearch = (tCompSm && tCompSm.summarySecondarySearch) || "Search applies together with the filters above.";
          var secondaryNoDominant = (tCompSm && tCompSm.summarySecondaryNoDominantView) || "View: components without a ranked primary issue.";
          var secondarySevInView = (tCompSm && tCompSm.summarySecondarySeverityInView) || "In current results: {critical} critical · {high} high.";
          var primary = totalVisible === 0 ? primaryEmpty : primaryRange.replace("{start}", String(showingStart)).replace("{end}", String(showingEnd)).replace("{matching}", String(totalVisible)).replace("{listTotal}", String(listTotal));
          if (totalVisible > 0 && workspaceTotal != null && workspaceTotal !== listTotal) {
            primary += workspaceSeg.replace("{workspaceTotal}", String(workspaceTotal));
          }
          var secParts = [secondarySorted.replace("{sortLabel}", sortLabelSm)];
          if (issueType === "NO_DOMINANT_ISSUE") secParts.push(secondaryNoDominant);
          if (!showHealthy && healthyCount > 0) secParts.push(secondaryHealthyHidden.replace("{count}", String(healthyCount)));
          if (search) secParts.push(secondarySearch);
          if (showHealthy && issueType !== "NO_DOMINANT_ISSUE" && (criticalCount > 0 || highCount > 0)) {
            secParts.push(secondarySevInView.replace("{critical}", String(criticalCount)).replace("{high}", String(highCount)));
          }
          var secondary = secParts.join(" ");
          if (primEl) primEl.textContent = primary;
          if (secEl) secEl.textContent = secondary;
        }

        var compSumm = document.getElementById("components-compare-summary");
        if (compSumm && rows.length > 0) {
          var baselineMap2 = window.__baselineBySourceRoot__ || {};
          var hasAnyBaseline = false;
          for (var bk in baselineMap2) {
            if (Object.prototype.hasOwnProperty.call(baselineMap2, bk) && baselineMap2[bk] != null && baselineMap2[bk] !== undefined) {
              hasAnyBaseline = true;
              break;
            }
          }
          var countsCmp = { worsened: 0, improved: 0, resolved: 0, newC: 0, issueCh: 0 };
          for (var vi = 0; vi < visibleRows.length; vi++) {
            var vr = visibleRows[vi];
            if (!vr.hasAttribute("data-compare-impact")) continue;
            var vk = vr.getAttribute("data-compare-kind") || "";
            if (vk === "worse") countsCmp.worsened++;
            else if (vk === "better") countsCmp.improved++;
            else if (vk === "resolved") countsCmp.resolved++;
            else if (vk === "new") countsCmp.newC++;
            else if (vk === "changed") countsCmp.issueCh++;
          }
          var tCmpStrip = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.components;
          var stripTpl =
            (tCmpStrip && tCmpStrip.summaryCompareStrip) ||
            "{worsened} worsened · {improved} improved · {resolved} resolved · {new} new · {issueChanged} issue changed (in view)";
          if (hasAnyBaseline && visibleRows.some(function(r) { return r.hasAttribute("data-compare-impact"); })) {
            compSumm.textContent = stripTpl
              .replace("{worsened}", String(countsCmp.worsened))
              .replace("{improved}", String(countsCmp.improved))
              .replace("{resolved}", String(countsCmp.resolved))
              .replace("{new}", String(countsCmp.newC))
              .replace("{issueChanged}", String(countsCmp.issueCh));
            compSumm.hidden = false;
          } else {
            compSumm.textContent = "";
            compSumm.hidden = true;
          }
        }

        var activeFiltersEl = document.getElementById("components-active-filters");
        if (activeFiltersEl) {
          var chips = [];
          var tChip = window.__TRANSLATIONS__;
          var issues = tChip && tChip.issues;
          var severityLabels = tChip && tChip.severity;
          var tCompChip = tChip && tChip.components;
          var clearAllLabel = (tCompChip && tCompChip.clearAllFilters) || (tCompChip && tCompChip.clearAll) || "Clear all filters";
          var healthyHiddenLabel = (tCompChip && tCompChip.healthyHiddenChip) || "Healthy hidden";
          var chipSearchP = (tCompChip && tCompChip.chipSearch) || "Search: ";
          var chipIssueP = (tCompChip && tCompChip.chipIssue) || "Issue: ";
          var chipSeverityP = (tCompChip && tCompChip.chipSeverity) || "Severity: ";
          var chipAreaP = (tCompChip && tCompChip.chipArea) || "Area: ";
          var chipRuleP = (tCompChip && tCompChip.chipRule) || "Rule: ";
          var chipProjectP = (tCompChip && tCompChip.chipProject) || "Project: ";
          var chipSortP = (tCompChip && tCompChip.chipSort) || "Sort: ";
          var chipCompareP = (tCompChip && tCompChip.chipCompare) || "Compare: ";
          var removeChipTpl = (tCompChip && tCompChip.chipRemove) || "Remove {label}";
          var sortLabelChip = sortSelect && sortSelect.options[sortSelect.selectedIndex] ? sortSelect.options[sortSelect.selectedIndex].text : "Highest risk";
          if (search) {
            var searchDisp = search.length > 40 ? search.substring(0, 40) + "…" : search;
            chips.push({ type: "search", label: chipSearchP + searchDisp, fullLabel: chipSearchP + search });
          }
          if (issueType && issueType !== "all") {
            var issueTxt = (issues && issues[issueType]) || issueType;
            chips.push({ type: "issue", label: chipIssueP + issueTxt, fullLabel: chipIssueP + issueTxt });
          }
          if (severity && severity !== "all") {
            var sevTxt = (severityLabels && severityLabels[severity.toLowerCase()]) || severity;
            chips.push({ type: "severity", label: chipSeverityP + sevTxt, fullLabel: chipSeverityP + sevTxt });
          }
          if (structureFilter) {
            var structByType = window.__STRUCTURE_BY_TYPE__ || {};
            var struct = structByType[structureFilter];
            var areaTxt = (struct && struct.label) || structureFilter;
            chips.push({ type: "structure", label: chipAreaP + areaTxt, fullLabel: chipAreaP + areaTxt });
          }
          if (ruleFilter) {
            var rulesById = window.__RULES_BY_ID__ || {};
            var rule = rulesById[ruleFilter];
            var ruleTxt = (rule && rule.title) || ruleFilter;
            chips.push({ type: "rule", label: chipRuleP + ruleTxt, fullLabel: chipRuleP + ruleTxt });
          }
          if (projectFilter) chips.push({ type: "project", label: chipProjectP + projectFilter, fullLabel: chipProjectP + projectFilter });
          if (!showHealthy && healthyCount > 0) chips.push({ type: "healthyHidden", label: healthyHiddenLabel, fullLabel: healthyHiddenLabel });
          if (compareSelect && !compareSelect.disabled && compareFilter && compareFilter !== "all") {
            var optC = compareSelect.options[compareSelect.selectedIndex];
            var compareLbl = optC ? optC.text : compareFilter;
            chips.push({ type: "compare", label: chipCompareP + compareLbl, fullLabel: chipCompareP + compareLbl });
          }
          if (sortSelect && sortSelect.value !== "highest-risk") {
            chips.push({ type: "sort", label: chipSortP + sortLabelChip, fullLabel: chipSortP + sortLabelChip });
          }
          var html = "";
          chips.forEach(function(c) {
            var full = c.fullLabel || c.label || "";
            var removeAria = removeChipTpl.replace("{label}", full);
            html += "<span class=\\"active-filter-chip\\" data-filter-type=\\"" + (c.type || "") + "\\"><span class=\\"active-filter-chip-label\\" title=\\"" + esc(full) + "\\">" + esc(c.label || "") + "</span><button type=\\"button\\" class=\\"active-filter-chip-remove\\" aria-label=\\"" + esc(removeAria) + "\\">×</button></span>";
          });
          if (chips.length > 0) html += "<button type=\\"button\\" class=\\"active-filter-clear-all\\">" + esc(clearAllLabel) + "</button>";
          activeFiltersEl.innerHTML = html;
          activeFiltersEl.style.display = chips.length > 0 ? "flex" : "none";
          activeFiltersEl.querySelectorAll(".active-filter-chip-remove").forEach(function(btn) {
            btn.addEventListener("click", function(e) {
              e.stopPropagation();
              var chip = btn.closest(".active-filter-chip");
              var filterType = chip ? chip.getAttribute("data-filter-type") : "";
              if (filterType === "search" && searchInput) searchInput.value = "";
              if (filterType === "issue" && issueSelect) issueSelect.value = "all";
              if (filterType === "severity" && severitySelect) severitySelect.value = "all";
              if (filterType === "structure") { var el = document.getElementById("filter-structure-concern"); if (el) el.value = ""; }
              if (filterType === "rule") { var el = document.getElementById("filter-rule-id"); if (el) el.value = ""; }
              if (filterType === "project") { var el = document.getElementById("filter-project"); if (el) el.value = ""; }
              if (filterType === "healthyHidden" && showHealthyCheckbox) showHealthyCheckbox.checked = true;
              if (filterType === "compare" && compareSelect) compareSelect.value = "all";
              if (filterType === "sort" && sortSelect) sortSelect.value = "highest-risk";
              currentPage = 0;
              if (filterType === "sort") applySort();
              applyComponentsExplorerFilters();
            });
          });
          var clearAllBtn = activeFiltersEl.querySelector(".active-filter-clear-all");
          if (clearAllBtn) clearAllBtn.addEventListener("click", function() {
            if (searchInput) searchInput.value = "";
            if (issueSelect) issueSelect.value = "all";
            if (severitySelect) severitySelect.value = "all";
            if (sortSelect) sortSelect.value = "highest-risk";
            var ruleEl = document.getElementById("filter-rule-id"); if (ruleEl) ruleEl.value = "";
            var structEl = document.getElementById("filter-structure-concern"); if (structEl) structEl.value = "";
            var projEl = document.getElementById("filter-project"); if (projEl) projEl.value = "";
            if (showHealthyCheckbox) showHealthyCheckbox.checked = false;
            if (compareSelect) compareSelect.value = "all";
            currentPage = 0;
            applySort();
            applyFilters();
          });
        }

        if (paginationPrev) paginationPrev.disabled = currentPage <= 0;
        if (paginationNext) paginationNext.disabled = currentPage >= totalPages - 1 || totalPages <= 1;
        if (paginationPages) {
          var pageLinks = [];
          if (totalPages > 1) {
            var maxVisible = 7;
            var startPage = Math.max(0, Math.min(currentPage - Math.floor(maxVisible / 2), totalPages - maxVisible));
            var endPage = Math.min(totalPages, startPage + maxVisible);
            if (startPage > 0) pageLinks.push('<button type="button" class="pagination-page" data-page="0">1</button>');
            if (startPage > 1) pageLinks.push("<span class=\\"pagination-ellipsis\\">…</span>");
            for (var p = startPage; p < endPage; p++) {
              pageLinks.push('<button type="button" class="pagination-page' + (p === currentPage ? ' active' : '') + '" data-page="' + p + '">' + (p + 1) + '</button>');
            }
            if (endPage < totalPages - 1) pageLinks.push("<span class=\\"pagination-ellipsis\\">…</span>");
            if (endPage < totalPages) pageLinks.push('<button type="button" class="pagination-page" data-page="' + (totalPages - 1) + '">' + totalPages + '</button>');
          } else if (totalPages >= 1) {
            pageLinks.push('<span class="pagination-current">1</span>');
          }
          paginationPages.innerHTML = pageLinks.join("");
          paginationPages.querySelectorAll(".pagination-page").forEach(function(btn) {
            btn.addEventListener("click", function() {
              currentPage = parseInt(btn.getAttribute("data-page") || "0", 10);
              applyComponentsExplorerFilters();
            });
          });
        }
      }

      function applySort() {
        var listWrap = document.getElementById("components-explorer-list-wrap");
        if (!listWrap) return;
        var list = listWrap.querySelector(".component-explorer-list");
        var rows = Array.from(listWrap.querySelectorAll(".component-explorer-row"));
        var sortBy = sortSelect?.value || "highest-risk";

        function num(a, key) { return parseInt(a.getAttribute("data-" + key) || "0", 10); }
        function severityRank(s) {
          /* Keep in sync with explorerSeveritySortRank in component-explorer-ui-copy.ts */
          var m = { CRITICAL: 4, HIGH: 3, WARNING: 2, LOW: 1 };
          return m[s] != null ? m[s] : 0;
        }
        rows.sort(function(a, b) {
          if (sortBy === "highest-risk") return num(b, "risk-score") - num(a, "risk-score");
          if (sortBy === "line-count") return num(b, "line-count") - num(a, "line-count");
          if (sortBy === "dependency-count") return num(b, "dependency-count") - num(a, "dependency-count");
          if (sortBy === "template-complexity") return num(b, "template-lines") - num(a, "template-lines");
          if (sortBy === "warning-count") return num(b, "warning-count") - num(a, "warning-count");
          if (sortBy === "diff-impact") {
            var ia = parseInt(a.getAttribute("data-compare-impact") || "-1", 10);
            var ib = parseInt(b.getAttribute("data-compare-impact") || "-1", 10);
            if (ib !== ia) return ib - ia;
          }
          if (sortBy === "worse-first") {
            var wa = parseInt(a.getAttribute("data-compare-wdelta") || "0", 10);
            var wb = parseInt(b.getAttribute("data-compare-wdelta") || "0", 10);
            if (wb !== wa) return wb - wa;
            var i1 = parseInt(a.getAttribute("data-compare-impact") || "-1", 10);
            var i2 = parseInt(b.getAttribute("data-compare-impact") || "-1", 10);
            if (i2 !== i1) return i2 - i1;
          }
          if (sortBy === "better-first") {
            var ba = parseInt(a.getAttribute("data-compare-bdelta") || "0", 10);
            var bb = parseInt(b.getAttribute("data-compare-bdelta") || "0", 10);
            if (bb !== ba) return bb - ba;
            var j1 = parseInt(a.getAttribute("data-compare-impact") || "-1", 10);
            var j2 = parseInt(b.getAttribute("data-compare-impact") || "-1", 10);
            if (j2 !== j1) return j2 - j1;
          }
          if (sortBy === "severity") {
            var ra = severityRank(a.getAttribute("data-severity") || "");
            var rb = severityRank(b.getAttribute("data-severity") || "");
            if (rb !== ra) return rb - ra;
          }
          var na = (a.getAttribute("data-name") || "").toLowerCase();
          var nb = (b.getAttribute("data-name") || "").toLowerCase();
          return na.localeCompare(nb);
        });

        if (list) rows.forEach(function(r) { list.appendChild(r); });
      }

      function applyFilters() {
        const issueType = issueSelect?.value || "all";
        const severity = severitySelect?.value || "all";

        function filterItem(item) {
          const itemIssue = item.getAttribute("data-issue-type") || "";
          const itemSeverity = item.getAttribute("data-severity") || "";
          const matchIssue = !issueType || issueType === "all" || itemIssue.split(/\\s+/).includes(issueType);
          const matchSeverity = !severity || severity === "all" || !itemSeverity || itemSeverity === severity;
          return matchIssue && matchSeverity;
        }

        document.querySelectorAll(".section").forEach(function(section) {
          const items = section.querySelectorAll("[data-project], [data-issue-type], [data-severity]");
          let visible = 0;
          items.forEach(function(item) {
            const show = filterItem(item);
            item.style.display = show ? "" : "none";
            if (show) visible++;
          });
          const content = section.querySelector(".section-content");
          const emptyState = section.querySelector(".empty-state");
          if (content && items.length > 0) {
            content.style.display = visible === 0 ? "none" : "";
            if (emptyState) emptyState.style.display = visible === 0 ? "block" : "none";
          }
        });

        applyComponentsExplorerFilters();
      }

      if (issueSelect) issueSelect.addEventListener("change", function() { currentPage = 0; applyFilters(); });
      if (severitySelect) severitySelect.addEventListener("change", function() { currentPage = 0; applyFilters(); });
      if (sortSelect) {
        sortSelect.addEventListener("change", function() {
          applySort();
          applyComponentsExplorerFilters();
        });
      }
      if (compareSelect) {
        compareSelect.addEventListener("change", function() {
          currentPage = 0;
          applyComponentsExplorerFilters();
        });
      }
      if (pageSizeSelect) pageSizeSelect.addEventListener("change", function() { currentPage = 0; applyComponentsExplorerFilters(); });
      if (searchInput) {
        var searchTimeout;
        searchInput.addEventListener("input", function() { currentPage = 0; clearTimeout(searchTimeout); searchTimeout = setTimeout(applyComponentsExplorerFilters, 150); });
      }
      var searchClearBtn = document.getElementById("components-search-clear");
      if (searchClearBtn && searchInput) {
        searchClearBtn.addEventListener("click", function() {
          searchInput.value = "";
          searchInput.focus();
          currentPage = 0;
          applyComponentsExplorerFilters();
        });
      }
      if (paginationPrev) paginationPrev.addEventListener("click", function() { if (currentPage > 0) { currentPage--; applyComponentsExplorerFilters(); } });
      if (paginationNext) paginationNext.addEventListener("click", function() { currentPage++; applyComponentsExplorerFilters(); });

      var resetBtn = document.getElementById("components-reset-filters");
      if (resetBtn) {
        resetBtn.addEventListener("click", function() {
          if (issueSelect) issueSelect.value = "all";
          if (severitySelect) severitySelect.value = "all";
          if (searchInput) searchInput.value = "";
          if (sortSelect) sortSelect.value = "highest-risk";
          var ruleFilterEl = document.getElementById("filter-rule-id");
          if (ruleFilterEl) ruleFilterEl.value = "";
          var structureFilterEl = document.getElementById("filter-structure-concern");
          if (structureFilterEl) structureFilterEl.value = "";
          var projectFilterEl = document.getElementById("filter-project");
          if (projectFilterEl) projectFilterEl.value = "";
          if (showHealthyCheckbox) showHealthyCheckbox.checked = false;
          if (compareSelect) compareSelect.value = "all";
          currentPage = 0;
          applySort();
          applyFilters();
        });
      }
      if (showHealthyCheckbox) {
        showHealthyCheckbox.addEventListener("change", function() { currentPage = 0; applyComponentsExplorerFilters(); });
      }

      if (document.getElementById("components-explorer-list-wrap")) {
        applySort();
        syncExplorerCompare();
      }

      function applyRulesFilters() {
        var rulesPage = document.getElementById("page-rules");
        if (!rulesPage) return;
        var cards = rulesPage.querySelectorAll(".rule-card-compact");
        var categorySections = rulesPage.querySelectorAll(".rules-category-section");
        var strip = document.getElementById("rules-showing-strip");
        var categoryFilter = (document.getElementById("rules-filter-category") || {}).value || "";
        var severityFilter = (document.getElementById("rules-filter-severity") || {}).value || "";
        var triggeredFilter = (document.getElementById("rules-filter-triggered") || {}).value || "";
        var searchVal = ((document.getElementById("rules-filter-search") || {}).value || "").trim().toLowerCase();

        var total = cards.length;
        var visible = 0;

        function matchCard(card) {
          var cat = card.getAttribute("data-category") || "";
          var sev = card.getAttribute("data-severity") || "";
          var trig = card.getAttribute("data-triggered") || "";
          var title = (card.getAttribute("data-rule-title") || "").toLowerCase();
          var expl = (card.getAttribute("data-rule-explanation") || "").toLowerCase();
          var matchCat = !categoryFilter || cat === categoryFilter;
          var matchSev = !severityFilter || sev === severityFilter;
          var matchTrig = !triggeredFilter || trig === triggeredFilter;
          var matchSearch = !searchVal || title.indexOf(searchVal) >= 0 || expl.indexOf(searchVal) >= 0;
          return matchCat && matchSev && matchTrig && matchSearch;
        }

        cards.forEach(function(card) {
          var show = matchCard(card);
          card.style.display = show ? "" : "none";
          if (show) visible++;
        });

        categorySections.forEach(function(section) {
          var sectionCards = section.querySelectorAll(".rule-card-compact");
          var visibleInSection = 0;
          sectionCards.forEach(function(c) { if (c.style.display !== "none") visibleInSection++; });
          section.style.display = visibleInSection > 0 ? "" : "none";
        });

        if (strip) {
          var t = window.__TRANSLATIONS__;
          var showingTpl = (t && t.rules && t.rules.showingCount) ? t.rules.showingCount : "{shown} of {total} rules";
          strip.textContent = showingTpl.replace("{shown}", String(visible)).replace("{total}", String(total));
          strip.style.display = visible === 0 && (categoryFilter || severityFilter || triggeredFilter || searchVal) ? "block" : "block";
        }
      }

      function applyRulesSort() {
        var rulesPage = document.getElementById("page-rules");
        if (!rulesPage) return;
        var sortBy = (document.getElementById("rules-filter-sort") || {}).value || "priority";
        var lists = rulesPage.querySelectorAll(".rules-category-section .rules-card-list");
        lists.forEach(function(list) {
          var cards = Array.from(list.querySelectorAll(".rule-card-compact"));
          cards.sort(function(a, b) {
            if (sortBy === "priority") {
              var pa = parseInt(a.getAttribute("data-priority-score") || "0", 10);
              var pb = parseInt(b.getAttribute("data-priority-score") || "0", 10);
              return pb - pa;
            }
            if (sortBy === "affected") {
              var aa = parseInt(a.getAttribute("data-affected-count") || "0", 10);
              var ab = parseInt(b.getAttribute("data-affected-count") || "0", 10);
              return ab - aa;
            }
            if (sortBy === "count") {
              var ca = parseInt(a.getAttribute("data-violation-count") || "0", 10);
              var cb = parseInt(b.getAttribute("data-violation-count") || "0", 10);
              return cb - ca;
            }
            return 0;
          });
          cards.forEach(function(c) { list.appendChild(c); });
        });
      }

      var rulesFilterCategory = document.getElementById("rules-filter-category");
      var rulesFilterSeverity = document.getElementById("rules-filter-severity");
      var rulesFilterTriggered = document.getElementById("rules-filter-triggered");
      var rulesFilterSearch = document.getElementById("rules-filter-search");
      var rulesFilterSort = document.getElementById("rules-filter-sort");
      if (rulesFilterCategory) rulesFilterCategory.addEventListener("change", applyRulesFilters);
      if (rulesFilterSeverity) rulesFilterSeverity.addEventListener("change", applyRulesFilters);
      if (rulesFilterTriggered) rulesFilterTriggered.addEventListener("change", applyRulesFilters);
      if (rulesFilterSort) rulesFilterSort.addEventListener("change", applyRulesSort);
      if (rulesFilterSearch) {
        var rulesSearchTimeout;
        rulesFilterSearch.addEventListener("input", function() { clearTimeout(rulesSearchTimeout); rulesSearchTimeout = setTimeout(applyRulesFilters, 150); });
      }
      applyRulesFilters();
      applyRulesSort();

      document.querySelectorAll(".section.collapsible .section-title").forEach(function(el) {
        el.addEventListener("click", function() {
          el.closest(".section")?.classList.toggle("collapsed");
        });
      });

      document.querySelectorAll(".score-breakdown-collapsible .score-breakdown-toggle").forEach(function(el) {
        el.addEventListener("click", function() {
          el.closest(".score-breakdown-collapsible")?.classList.toggle("collapsed");
        });
      });

      function getDrawerT(key) {
        var t = window.__TRANSLATIONS__;
        if (!t) return key;
        var parts = key.split(".");
        var cur = t;
        for (var i = 0; i < parts.length && cur; i++) cur = cur[parts[i]];
        return cur || key;
      }
      function getRoleDisplayWithConfidence(role, confidence) {
        if (!role || role === "unknown" || confidence == null) {
          return { display: "Role unclear", level: "muted", isSecondary: true };
        }
        var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        var bucket = getConfidenceBucket(confidence);
        if (bucket === "high") {
          return { display: roleLabel, level: "definite", isSecondary: false };
        }
        if (bucket === "medium") {
          return { display: "Likely " + roleLabel, level: "likely", isSecondary: false };
        }
        if (bucket === "low") {
          return { display: "Likely " + roleLabel, level: "muted", isSecondary: true };
        }
        return { display: "Role heuristic", level: "muted", isSecondary: true };
      }
      function parseRefactorSteps(text) {
        if (!text || typeof text !== "string") return [];
        var steps = [];
        var parts = text.split(/(?:\\d+\\.\\s*|;\\s*|\\.\\s+(?=[A-Za-z])|\\.\\s*\\n)/).map(function(s) { return s.trim(); }).filter(Boolean);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          if (p.length > 8) steps.push(p.charAt(0).toUpperCase() + p.slice(1));
        }
        if (steps.length === 0 && text.trim().length > 8) steps.push(text.trim().charAt(0).toUpperCase() + text.trim().slice(1));
        return steps;
      }
      function getRefactorSteps(entry) {
        if (!entry) return [];
        var steps = [];
        if (entry.decompositionSuggestion) {
          var ds = entry.decompositionSuggestion;
          if (ds.extractedComponents && ds.extractedComponents.length) for (var ci = 0; ci < ds.extractedComponents.length; ci++) steps.push("Extract " + ds.extractedComponents[ci]);
          if (ds.extractedServices && ds.extractedServices.length) for (var si = 0; si < ds.extractedServices.length; si++) steps.push("Extract " + ds.extractedServices[si]);
          if (ds.suggestedArchitecture) steps.push(ds.suggestedArchitecture);
        }
        if (steps.length === 0 && entry.refactorDirection) steps = parseRefactorSteps(entry.refactorDirection);
        if (steps.length === 0 && (entry.issues && entry.issues[0])) steps.push(entry.issues[0].message);
        return steps;
      }
      function hasMeaningfulRefactor(entry) {
        return getRefactorSteps(entry).length > 0;
      }
      function getAvailableDetailActions(entry, sourceContext) {
        var dt = getDrawerT;
        var actions = [];
        var compName = (entry.className || entry.fileName || "").replace(/\\.component\\.ts$/i, "");
        var whyItMatters = entry.dominantIssue ? (dt("patternExplanations." + entry.dominantIssue + ".whyItMatters") || "") : "";
        var refactorSteps = getRefactorSteps(entry);
        var refactorText = entry.refactorDirection || (refactorSteps.length ? refactorSteps.join("\\n") : "");
        var copyRefactorLabel = dt("drawer.copyRefactorPlan") || dt("drawer.copyRefactor") || "Copy refactor plan";
        var openInPatternsLabel = dt("drawer.openInPatterns") || "Open in Patterns";
        var viewInComponentsLabel = dt("drawer.viewInComponents") || "Back to components";
        var openInPlannerLabel = dt("drawer.openInRefactorPlan") || "Open in refactor plan";
        var filterBySmellLabel = dt("drawer.filterBySameSmell") || "Filter by same issue type";
        var copyPathLabel = dt("drawer.copyPath") || "Copy file path";
        if (hasMeaningfulRefactor(entry)) {
          actions.push({ id: "copyRefactor", html: "<button type=\\"button\\" class=\\"btn-primary structure-copy-refactor-btn\\" data-refactor=\\"" + esc(refactorText) + "\\" data-why=\\"" + esc(whyItMatters) + "\\">" + esc(copyRefactorLabel) + "</button>" });
        }
        actions.push({ id: "openInPlanner", html: "<a href=\\"#planner\\" class=\\"btn-secondary planner-nav-link\\" data-nav=\\"planner\\">" + esc(openInPlannerLabel) + "</a>" });
        if (entry.dominantIssue) {
          actions.push({ id: "openInPatterns", html: "<a href=\\"#patterns\\" class=\\"btn-secondary planner-nav-link\\" data-nav=\\"patterns\\" data-pattern-key=\\"" + esc(entry.dominantIssue) + "\\">" + esc(openInPatternsLabel) + "</a>" });
          actions.push({ id: "filterBySmell", html: "<a href=\\"#components\\" class=\\"btn-secondary planner-nav-link\\" data-nav=\\"components\\" data-issue-type=\\"" + esc(entry.dominantIssue) + "\\">" + esc(filterBySmellLabel) + "</a>" });
        }
        if (sourceContext !== "components") {
          actions.push({ id: "viewInComponents", html: "<a href=\\"#components\\" class=\\"btn-secondary planner-nav-link\\" data-nav=\\"components\\" data-search=\\"" + esc(compName) + "\\">" + esc(viewInComponentsLabel) + "</a>" });
        }
        if (entry.filePath) {
          actions.push({ id: "copyPath", html: "<button type=\\"button\\" class=\\"btn-secondary drawer-path-copy\\" data-path=\\"" + esc(entry.filePath) + "\\" aria-label=\\"Copy path\\">" + esc(copyPathLabel) + "</button>" });
        }
        return actions;
      }
      function renderDetailContent(payload) {
        if (!payload) return "";
        switch (payload.type) {
          case "component": {
            var entry = getDetailEntry(payload.id) || createFallbackEntry(payload.id);
            return renderComponentDetailContent(entry);
          }
          case "pattern": {
            var patternData = typeof window.__PATTERN_DATA__ !== "undefined" ? window.__PATTERN_DATA__ : { patterns: {} };
            var pattern = patternData.patterns && patternData.patterns[payload.id];
            return pattern ? pattern.drawerHtml : "<p>Pattern not found.</p>";
          }
          case "rule": {
            var rulesById = window.__RULES_BY_ID__ || {};
            var rule = rulesById[payload.id];
            return renderRuleDetailContent(rule, payload.id);
          }
          case "structure": {
            var structureByType = window.__STRUCTURE_BY_TYPE__ || {};
            var concern = structureByType[payload.id];
            return concern ? renderStructureDetailContent(concern) : "<p>Structure concern not found.</p>";
          }
          case "minorAreas":
            return renderMinorAreasContent();
          default:
            return "<p>Unknown detail type.</p>";
        }
      }
      function getImpactBandLabelForDrawer(category) {
        var t = window.__TRANSLATIONS__;
        var r = t && t.rules;
        if (!r) return category || "";
        var map = { informational: r.impactBandInformational, local_maintainability: r.impactBandLocalMaintainability, cross_cutting_maintainability: r.impactBandCrossCutting, behavior_leak_risk: r.impactBandBehaviorLeakRisk };
        return map[category] || category || "";
      }
      function renderRuleDetailContent(rule, ruleId) {
        var dt = getDrawerT;
        var labelRuleId = dt("rules.ruleDetailRuleId") || "Rule ID";
        var labelDetects = dt("rules.ruleDetailWhatItDetects") || "What it detects";
        var labelWhy = dt("rules.whyItMatters") || "Why it matters";
        var labelNext = dt("rules.ruleDetailNextStep") || "Suggested next step";
        var labelMore = dt("rules.ruleDetailMoreExamples") || "Examples and technical detail";
        var badLabel = dt("rules.badExample") || "Bad example";
        var goodLabel = dt("rules.goodExample") || "Good example";
        var refactorLabel = dt("rules.refactorDirection") || "Refactor direction";
        var suggestedActionLabel = dt("rules.suggestedAction") || "Suggested action";
        var workspaceImpactLabel = dt("rules.workspaceImpact") || "Workspace impact";
        var topAffectedLabel = dt("rules.topAffectedComponents") || "Top affected components";
        var openAffectedLabel = dt("rules.openAffectedComponents") || "Open affected components";
        var commonFalsePositivesLabel = dt("rules.commonFalsePositives") || "Common false positive patterns";
        var limitedLabel = dt("rules.ruleDetailLimited") || "Details limited";
        var unknownBody = dt("rules.ruleDetailUnknownBody") || "This rule id is not in the Modulens rule catalog for this report. Counts below reflect what was recorded during the scan.";
        var ruleToAffected = window.__RULE_TO_AFFECTED__ || {};
        var violationCounts = window.__RULE_VIOLATION_COUNTS__ || {};
        var count = violationCounts[ruleId] || 0;
        var affectedPaths = ruleToAffected[ruleId] || [];
        var affectedCount = affectedPaths.length;
        var topPaths = affectedPaths.slice(0, 8);

        function truncateDrawerText(text, max) {
          if (!text || typeof text !== "string") return "";
          var s = text.replace(/\\s+/g, " ").trim();
          if (s.length <= max) return s;
          var slice = s.slice(0, max);
          var sp = slice.lastIndexOf(" ");
          if (sp > max * 0.55) slice = slice.slice(0, sp);
          return slice.trim() + "…";
        }
        function firstSeg(t, max) {
          if (!t || typeof t !== "string") return "";
          var s = t.replace(/\\s+/g, " ").trim();
          var cut = s.split(/[.;]\\s+/)[0] || s;
          return truncateDrawerText(cut.trim(), max);
        }
        function appendWorkspaceImpact(html) {
          if (count <= 0 && affectedCount <= 0) return html;
          html += "<h4 class=\\"rule-section-label\\">" + esc(workspaceImpactLabel) + "</h4>";
          if (affectedCount === 1 && count === 1) {
            html += "<p class=\\"rule-workspace-impact\\">Triggered in 1 component.</p>";
          } else if (affectedCount === 1 && count > 1) {
            html += "<p class=\\"rule-workspace-impact\\">Triggered in 1 component (" + count + " occurrences).</p>";
          } else {
            html += "<p class=\\"rule-workspace-impact\\">Triggered in " + affectedCount + " components (" + count + " times across workspace).</p>";
          }
          html += "<p class=\\"rule-workspace-impact-label\\">" + esc(topAffectedLabel) + ":</p>";
          html += "<ul class=\\"rule-affected-paths\\">";
          for (var wi = 0; wi < topPaths.length; wi++) {
            var p = topPaths[wi];
            var short = p.indexOf("src/") >= 0 ? p.substring(p.indexOf("src/")) : p;
            if (short.length > 60) short = "..." + short.slice(-57);
            html += "<li><code>" + esc(short) + "</code></li>";
          }
          html += "</ul>";
          if (affectedPaths.length > 8) html += "<p class=\\"rule-affected-more\\">" + esc((affectedPaths.length - 8) + " more") + "</p>";
          html += "<div class=\\"rule-investigation-actions\\">";
          html += "<a href=\\"#components\\" class=\\"rule-action-link rule-action-open-affected btn-primary planner-nav-link\\" data-nav=\\"components\\" data-rule-id=\\"" + esc(ruleId) + "\\">" + esc(openAffectedLabel) + "</a>";
          html += "</div>";
          return html;
        }

        var html = "<div class=\\"drawer-section rule-drawer-standardized rule-drawer-detail\\">";
        html += "<p class=\\"rule-detail-id-line\\"><span class=\\"rule-detail-meta-label\\">" + esc(labelRuleId) + ":</span> <code class=\\"rule-detail-id-code\\">" + esc(ruleId) + "</code></p>";

        if (!rule) {
          html += "<p class=\\"rule-detail-limited-badge text-muted\\">" + esc(limitedLabel) + "</p>";
          html += "<p class=\\"rule-explanation\\">" + esc(unknownBody) + "</p>";
          html = appendWorkspaceImpact(html);
          html += "</div>";
          return html;
        }

        html += "<h4 class=\\"rule-section-label\\">" + esc(labelDetects) + "</h4><p class=\\"rule-explanation\\">" + esc(truncateDrawerText(rule.explanation, 340)) + "</p>";
        html += "<h4 class=\\"rule-section-label\\">" + esc(labelWhy) + "</h4><p class=\\"rule-why\\">" + esc(truncateDrawerText(rule.whyItMatters, 360)) + "</p>";
        var nextText = rule.suggestedAction ? rule.suggestedAction : firstSeg(rule.refactorDirection, 220);
        if (nextText) {
          html += "<h4 class=\\"rule-section-label\\">" + esc(labelNext) + "</h4><p class=\\"rule-suggested-action\\">" + esc(nextText) + "</p>";
        }
        if (rule.impactCategory) {
          var impactBandLabel = getImpactBandLabelForDrawer(rule.impactCategory);
          html += "<p class=\\"rule-impact-band-drawer\\"><span class=\\"badge rule-impact-badge rule-impact-" + esc(rule.impactCategory) + "\\">" + esc(impactBandLabel) + "</span></p>";
        }
        var detailsInner = "";
        detailsInner += "<h4 class=\\"rule-section-label\\">" + esc(badLabel) + "</h4><pre class=\\"rule-example rule-bad rule-example-compact\\">" + esc(rule.badExample) + "</pre>";
        detailsInner += "<h4 class=\\"rule-section-label\\">" + esc(goodLabel) + "</h4><pre class=\\"rule-example rule-good rule-example-compact\\">" + esc(rule.goodExample) + "</pre>";
        if (rule.commonFalsePositives) {
          detailsInner += "<h4 class=\\"rule-section-label\\">" + esc(commonFalsePositivesLabel) + "</h4><p class=\\"rule-common-false-positives\\">" + esc(rule.commonFalsePositives) + "</p>";
        }
        detailsInner += "<h4 class=\\"rule-section-label\\">" + esc(refactorLabel) + "</h4><p class=\\"rule-refactor\\">" + esc(rule.refactorDirection) + "</p>";
        if (rule.suggestedAction) {
          detailsInner += "<h4 class=\\"rule-section-label\\">" + esc(suggestedActionLabel) + "</h4><p class=\\"rule-suggested-action\\">" + esc(rule.suggestedAction) + "</p>";
        }
        html += "<details class=\\"rule-detail-more\\"><summary class=\\"rule-detail-more-summary\\">" + esc(labelMore) + "</summary><div class=\\"rule-detail-more-body\\">" + detailsInner + "</div></details>";
        html = appendWorkspaceImpact(html);
        html += "</div>";
        return html;
      }
      function renderStructureDetailContent(concern) {
        var dt = getDrawerT;
        var section = function(title, content) { return "<div class=\\"structure-modal-section\\"><h4 class=\\"structure-modal-section-title\\">" + esc(title) + "</h4>" + content + "</div>"; };
        var conf = concern.confidence || "medium";
        var impact = concern.impact || "medium";
        var confTooltipKey = conf === "low" ? "structure.confidenceLowTooltip" : conf === "medium" ? "structure.confidenceMediumTooltip" : "structure.confidenceHighTooltip";
        var confTooltip = dt(confTooltipKey) || "";
        var confTitle = confTooltip ? " title=\\"" + esc(confTooltip) + "\\"" : "";
        var affectedCount = concern.affectedCount || 0;
        var areaCounts = (concern.affectedAreasWithCounts && concern.affectedAreasWithCounts.length
          ? concern.affectedAreasWithCounts
          : []);
        var totalFromCounts = areaCounts.reduce(function (sum, a) { return sum + (a && a.count != null ? a.count : 0); }, 0);
        var otherEntry = areaCounts.find
          ? areaCounts.find(function (a) { return (a.area || "").toLowerCase() === "other"; })
          : null;
        var otherCount = otherEntry && otherEntry.count != null ? otherEntry.count : 0;
        var otherShare = affectedCount > 0 ? otherCount / affectedCount : 0;
        var hasCanonicalAreas = areaCounts.length > 0 && totalFromCounts === affectedCount;
        var isWeakAreaInference = !hasCanonicalAreas || otherShare >= 0.6;
        var areaCount = hasCanonicalAreas && !isWeakAreaInference ? areaCounts.length : 0;
        var summaryBadges = "<span class=\\"structure-modal-badge confidence-" + conf + "\\"" + confTitle + ">" + esc(conf) + " confidence</span><span class=\\"structure-modal-badge impact-" + impact + "\\">" + esc(impact) + " impact</span><span class=\\"structure-modal-badge\\">" + affectedCount + " files</span>";
        var quickSummary = (concern.whyItMatters || "").substring(0, 160).trim() + ((concern.whyItMatters || "").length > 160 ? "..." : "");
        var html = "<div class=\\"structure-modal-content\\">";
        html += "<div class=\\"structure-drawer-quick-summary drawer-section\\">" + esc(quickSummary) + "</div>";
        html += section(dt("structure.sectionWhyItMatters") || "Why it matters", "<p class=\\"structure-modal-why\\">" + esc(concern.whyItMatters) + "</p>");
        if (concern.concernType === "suspicious-placement" && concern.suspiciousPlacementDetails && concern.suspiciousPlacementDetails.length) {
          var storyTitle = dt("structure.suspiciousPlacementRefactorStory") || "Refactor story";
          var currentLocLabel = dt("structure.currentLocation") || "Current location";
          var likelyFeatureLabel = dt("structure.likelyOwningFeature") || "Likely owning feature";
          var whySuspLabel = dt("structure.whySuspicious") || "Why this is suspicious";
          var suggestedMoveLabel = dt("structure.suggestedMove") || "Suggested move";
          var alsoFlaggedTpl = dt("structure.alsoFlaggedAs") || "Also flagged as {issue}";
          var details = concern.suspiciousPlacementDetails.slice(0, 6);
          var storyItems = details.map(function(d) {
            var feat = d.likelyOwningFeature || "—";
            var issueLabel = dt("issues." + d.dominantIssue) || (d.dominantIssue || "").replace(/_/g, " ").replace(/\\b\\w/g, function(c){ return c.toUpperCase(); });
            var alsoBadge = d.dominantIssue ? "<span class=\\"structure-detail-also-flagged planner-nav-link\\" data-nav=\\"components\\" data-issue-type=\\"" + esc(d.dominantIssue) + "\\">" + esc(alsoFlaggedTpl.replace("{issue}", issueLabel)) + "</span>" : "";
            return "<div class=\\"structure-suspicious-detail-item\\"><div class=\\"structure-detail-row\\"><strong>" + esc(currentLocLabel) + ":</strong> <code>" + esc(d.currentLocation) + "</code></div><div class=\\"structure-detail-row\\"><strong>" + esc(likelyFeatureLabel) + ":</strong> " + esc(feat) + "</div><div class=\\"structure-detail-row\\"><strong>" + esc(whySuspLabel) + ":</strong> " + esc(d.whySuspicious) + "</div><div class=\\"structure-detail-row\\"><strong>" + esc(suggestedMoveLabel) + ":</strong> " + esc(d.suggestedMoveDirection) + "</div>" + (alsoBadge ? "<div class=\\"structure-detail-row\\">" + alsoBadge + "</div>" : "") + "</div>";
          });
          html += section(storyTitle, "<div class=\\"structure-suspicious-details\\">" + storyItems.join("") + "</div>");
        }
        if (concern.whyFlaggedHere) html += section(dt("structure.sectionDetectionLogic") || "Detection logic", "<p class=\\"structure-modal-why-flagged\\">" + esc(concern.whyFlaggedHere) + "</p>");
        if (concern.samplePaths && concern.samplePaths.length) {
          var pathSegments = ["pages", "components", "shared", "common"];
          function highlightPath(p) {
            var escaped = esc(p);
            for (var i = 0; i < pathSegments.length; i++) {
              var seg = pathSegments[i];
              escaped = escaped.replace(new RegExp("(" + seg + ")", "gi"), "<span class=\\"path-segment-highlight\\">$1</span>");
            }
            return escaped;
          }
          var summaryLine = areaCount > 0
            ? (dt("structure.filesAffectedAcrossAreas") || "{count} files affected across {areas} main areas").replace("{count}", concern.affectedCount).replace("{areas}", String(areaCount))
            : (dt("structure.filesAffected") || "{count} files affected").replace("{count}", concern.affectedCount);
          var maxPaths = 4;
          var pathRemaining = Math.max(0, concern.samplePaths.length - maxPaths);
          function truncatePathForDisplay(path, maxLen) {
            if (path.length <= maxLen) return path;
            var lastSlash = path.lastIndexOf("/");
            if (lastSlash >= 0 && path.length - lastSlash <= maxLen - 4) return "..." + path.slice(lastSlash);
            return "..." + path.slice(-(maxLen - 3));
          }
          var pathsHtml = "";
          for (var pj = 0; pj < Math.min(concern.samplePaths.length, maxPaths); pj++) {
            var p = concern.samplePaths[pj];
            var shortP = truncatePathForDisplay(p, 55);
            var pathEsc = esc(p).replace(/"/g, "&quot;");
            pathsHtml += "<li class=\\"structure-path-item\\" title=\\"" + pathEsc + "\\"><code class=\\"structure-path-code\\">" + highlightPath(shortP) + "</code><button type=\\"button\\" class=\\"structure-path-copy\\" data-path=\\"" + pathEsc + "\\" aria-label=\\"Copy\\">Copy</button></li>";
          }
          if (pathRemaining > 0) pathsHtml += "<li class=\\"structure-path-more\\">+" + pathRemaining + " more</li>";
          html += section(dt("structure.sectionSamplePaths") || "Sample paths", "<p class=\\"structure-paths-summary\\">" + esc(summaryLine) + "</p><ul class=\\"structure-sample-paths\\">" + pathsHtml + "</ul>");
        }
        if (hasCanonicalAreas && !isWeakAreaInference) {
          var maxAreas = 8;
          var visibleAreas = areaCounts.slice(0, maxAreas);
          var remaining = areaCounts.length - maxAreas;
          var chipsHtml = visibleAreas
            .map(function(a) { return "<span class=\\"structure-area-chip\\">" + esc(a.area) + " <span class=\\"structure-area-count\\">" + a.count + "</span></span>"; })
            .join("");
          if (remaining > 0) chipsHtml += "<span class=\\"structure-area-more\\">+" + remaining + " more</span>";
          html += section(dt("structure.sectionAffectedAreas") || "Affected areas", "<div class=\\"structure-area-chips\\">" + chipsHtml + "</div>");
        } else {
          var fallbackLabel = dt("structure.areaBreakdownUnavailable") || dt("structure.multipleAreasAffected") || "Multiple areas affected";
          html += section(dt("structure.sectionAffectedAreas") || "Affected areas", "<p class=\\"structure-area-fallback\\">" + esc(fallbackLabel) + "</p>");
        }
        var refactorText = concern.refactorDirection || "";
        var refactorBullets = refactorText.split(/\\s*\\.\\s+|\\n+/).map(function(s){ return s.trim(); }).filter(Boolean).slice(0, 4);
        var refactorHtml;
        if (refactorBullets.length >= 2) {
          refactorHtml = "<div class=\\"structure-refactor-guidance\\"><ul class=\\"structure-refactor-bullets\\">" + refactorBullets.map(function(b){ return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></div>";
        } else {
          refactorHtml = "<div class=\\"structure-refactor-guidance\\"><p class=\\"structure-refactor-main\\">" + esc(refactorText) + "</p></div>";
        }
        if (concern.refactorOptions && concern.refactorOptions.length) {
          var optsTitle = dt("structure.sectionRefactorOptions") || "Refactor options";
          var whenToUseLabel = dt("structure.whenToUse") || "When to use";
          var optLabelKey = { "move-to-feature": "structure.refactorOptionMoveToFeature", "shallow-api": "structure.refactorOptionShallowAPI", "wrapper-only": "structure.refactorOptionWrapperOnly" };
          var optsHtml = concern.refactorOptions.map(function(o) {
            var label = dt(optLabelKey[o.id]) || o.label;
            return "<div class=\\"structure-refactor-option\\"><strong>" + esc(label) + "</strong><p>" + esc(o.description) + "</p><p class=\\"structure-option-when\\"><em>" + esc(whenToUseLabel) + ":</em> " + esc(o.whenToUse) + "</p></div>";
          }).join("");
          html += section(optsTitle, "<div class=\\"structure-refactor-options\\">" + optsHtml + "</div>");
        }
        html += section(dt("structure.sectionRefactorGuidance") || "Refactor guidance", refactorHtml);
        html += section(dt("structure.sectionSuggestedNextStep") || "Suggested next step", "<p class=\\"structure-suggested-step\\">" + esc(concern.refactorDirection.split(/\\s*\\.\\s+|\\n+/)[0] || concern.refactorDirection) + ".</p>");
        var inspectLabel = dt("structure.ctaOpenAffectedComponents") || dt("structure.viewAffectedFiles") || dt("structure.inspectFiles") || "Open affected components";
        var inspectTooltip = dt("structure.viewAffectedFilesTooltip") || "Opens Components page filtered to files affected by this concern";
        var openPlanLabel = dt("structure.ctaOpenRefactorPlan") || "Open refactor plan";
        var copyLabel = dt("structure.ctaCopyMigrationStrategy") || dt("structure.copyRefactor") || "Copy migration strategy";
        var refactorEsc = esc(concern.refactorDirection).replace(/"/g, "&quot;");
        var whyEsc = esc(concern.whyItMatters).replace(/"/g, "&quot;");
        var migrationText = concern.refactorDirection + (concern.refactorOptions && concern.refactorOptions.length ? "\\n\\nOptions: " + concern.refactorOptions.map(function(o){ return o.label + ": " + o.description; }).join("; ") : "");
        var migrationEsc = esc(migrationText).replace(/"/g, "&quot;");
        html += "<div class=\\"structure-modal-actions\\"><a href=\\"#components\\" class=\\"btn-primary planner-nav-link\\" data-nav=\\"components\\" data-structure-concern=\\"" + esc(concern.concernType) + "\\" title=\\"" + esc(inspectTooltip) + "\\">" + esc(inspectLabel) + "</a>";
        html += "<a href=\\"#planner\\" class=\\"btn-secondary planner-nav-link\\" data-nav=\\"planner\\" data-planner-section=\\"extraction-opportunities\\" data-structure-concern=\\"" + esc(concern.concernType) + "\\">" + esc(openPlanLabel) + "</a>";
        html += "<button type=\\"button\\" class=\\"btn-secondary structure-copy-refactor-btn\\" data-refactor=\\"" + migrationEsc + "\\" data-why=\\"" + whyEsc + "\\">" + esc(copyLabel) + "</button></div>";
        html += "</div>";
        return html;
      }
      function renderMinorAreasContent() {
        var clusters = window.__OTHER_MINOR_CLUSTERS__ || [];
        var dt = getDrawerT;
        var unclassifiedLabel = dt("overview.unclassified") || "unclassified";
        var intro = dt("overview.minorAreasIntro") || "These areas have fewer components but may still carry findings.";
        var html = "<p class=\\"drawer-minor-areas-intro\\">" + esc(intro) + "</p><ul class=\\"drawer-minor-clusters-list\\">";
        for (var i = 0; i < clusters.length; i++) {
          var m = clusters[i];
          var label = m.sourceRoot === "unclassified" ? unclassifiedLabel : m.sourceRoot;
          var mTotal = (m.componentFindings != null ? m.componentFindings : (m.componentsWithFindings || 0)) + (m.templateFindings || 0) + (m.responsibilityFindings || 0) + (m.lifecycleFindings || 0);
          html += "<li class=\\"drawer-minor-cluster-item\\">" + esc(label) + " (" + m.components + ")" + (mTotal > 0 ? " — " + mTotal + " warnings" : "") + "</li>";
        }
        html += "</ul>";
        return html;
      }
      function deriveRuleGroupsFromRuleIds(ruleIds) {
        if (!ruleIds || !ruleIds.length) return [];
        var rulesById = window.__RULES_BY_ID__ || {};
        var RULE_CATEGORY_TO_GROUP = {
          "template-complexity": "template",
          "lifecycle-cleanup": "lifecycle",
          "responsibility-god": "responsibility",
          "component-size": "complexity",
          "dependency-orchestration": "orchestration"
        };
        var RULE_GROUP_PRIORITY = ["template", "lifecycle", "responsibility", "complexity", "orchestration", "generic"];
        var RULE_SEVERITY_WEIGHT = { critical: 3, high: 2, warning: 1, info: 0 };
        var scores = {};
        for (var i = 0; i < ruleIds.length; i++) {
          var id = ruleIds[i];
          var meta = rulesById[id];
          if (!meta) continue;
          var group = RULE_CATEGORY_TO_GROUP[meta.category] || "generic";
          var weight = RULE_SEVERITY_WEIGHT[meta.severity] || 0;
          var cur = scores[group] || { maxSeverityWeight: -1, count: 0 };
          if (weight > cur.maxSeverityWeight) cur.maxSeverityWeight = weight;
          cur.count += 1;
          scores[group] = cur;
        }
        var entries = Object.keys(scores).map(function(group) {
          return {
            group: group,
            maxSeverityWeight: scores[group].maxSeverityWeight,
            count: scores[group].count,
            priorityIndex: RULE_GROUP_PRIORITY.indexOf(group)
          };
        });
        entries.sort(function(a, b) {
          if (b.maxSeverityWeight !== a.maxSeverityWeight) return b.maxSeverityWeight - a.maxSeverityWeight;
          if (b.count !== a.count) return b.count - a.count;
          return (a.priorityIndex === -1 ? 999 : a.priorityIndex) - (b.priorityIndex === -1 ? 999 : b.priorityIndex);
        });
        return entries.slice(0, 2).map(function(e) { return e.group; });
      }
      function buildRiskLevelExplanationFromAttrs(attrs, entry) {
        var sev = (attrs.severity || "").toUpperCase();
        if (!sev) return null;
        var confidence = attrs.confidence || entry?.confidence || (attrs.anomaly === "severity-missing-with-critical-rules" ? "inferred" : attrs.anomaly === "metrics-missing-with-warnings" ? "low" : "measured");
        var anomaly = attrs.anomaly || "none";
        var warnings = attrs.warningCount != null ? attrs.warningCount : 0;
        var lineCount = attrs.lineCount != null ? attrs.lineCount : (entry && entry.lineCount != null ? entry.lineCount : 0);
        var dependencyCount = attrs.dependencyCount != null ? attrs.dependencyCount : (entry && entry.dependencyCount != null ? entry.dependencyCount : 0);
        var templateLines = attrs.templateLines != null ? attrs.templateLines : (entry && entry.template && entry.template.lineCount != null ? entry.template.lineCount : 0);
        var structuralDepth = attrs.structuralDepth != null ? attrs.structuralDepth : (entry && entry.template && entry.template.structuralDepth != null ? entry.template.structuralDepth : 0);
        var orchestration = entry && entry.responsibility && entry.responsibility.serviceOrchestrationCount != null ? entry.responsibility.serviceOrchestrationCount : 0;
        var subscriptions = entry && entry.lifecycle && entry.lifecycle.subscribeCount != null ? entry.lifecycle.subscribeCount : 0;
        var baseSeverity = entry && entry.highestSeverity ? String(entry.highestSeverity).toUpperCase() : null;
        var ruleIds = attrs.ruleIds || [];
        var dominantIssue = entry && entry.dominantIssue ? String(entry.dominantIssue) : null;
        var isHighOrCritical = sev === "HIGH" || sev === "CRITICAL";
        var mode = (confidence === "inferred" || confidence === "low" || (anomaly === "severity-missing-with-critical-rules" || (!baseSeverity && isHighOrCritical))) ? "inferred" : "measured";
        var ruleGroups = deriveRuleGroupsFromRuleIds(ruleIds);
        var RULE_GROUP_LABELS = {
          template: "Template complexity",
          lifecycle: "Lifecycle cleanup & subscriptions",
          responsibility: "Responsibilities & ownership",
          complexity: "Component size & complexity",
          orchestration: "Service orchestration & coupling",
          generic: "General diagnostic rules"
        };
        var drivers = [];
        for (var j = 0; j < ruleGroups.length && drivers.length < 2; j++) {
          var g = ruleGroups[j];
          var label = RULE_GROUP_LABELS[g] || "Diagnostic rules";
          drivers.push("Severity is influenced by " + label.toLowerCase() + " findings.");
        }
        function pushMetricDriver(condition, text) {
          if (!condition) return;
          if (drivers.length >= 3) return;
          drivers.push(text);
        }
        pushMetricDriver(lineCount >= 400 || dependencyCount >= 8, "Around " + lineCount + " LOC with " + dependencyCount + " injected dependencies.");
        pushMetricDriver(templateLines >= 150 || structuralDepth >= 5, "Template has ~" + templateLines + " lines with structural depth " + structuralDepth + ".");
        pushMetricDriver(orchestration >= 5 || subscriptions >= 5, "Coordinates " + orchestration + " services and " + subscriptions + " subscriptions.");
        pushMetricDriver(warnings >= 8, "Component aggregates " + warnings + " rule warnings.");
        if (drivers.length === 0 && (lineCount > 0 || dependencyCount > 0)) {
          drivers.push("Small component footprint with limited dependencies.");
        }
        if (drivers.length === 0 && warnings > 0) {
          drivers.push("A few low-impact rule warnings; address when touching this area.");
        }
        var headline = "";
        if (mode === "inferred") {
          if (isHighOrCritical) {
            headline = "No single dominant issue was selected, but the combined rule set indicates elevated risk.";
          } else {
            headline = "Severity reflects heuristic rules and limited metric coverage; confirm locally.";
          }
        } else {
          if (sev === "LOW") {
            headline = "Low severity based on current metrics; treat findings as hygiene improvements.";
          } else if (sev === "WARNING") {
            headline = "Moderate risk backed by component metrics; schedule this for focused refactoring.";
          } else if (dominantIssue) {
            headline = "Severity is backed by metrics and a dominant issue in the main risk area.";
          } else {
            headline = "Severity is backed by component metrics and rule findings.";
          }
        }
        return { mode: mode, headline: headline, drivers: drivers };
      }
      function renderDiagnosisSummary(entry, dt, esc) {
        if (!entry) return "";
        var html = "<div class=\\"diagnosis-summary\\">";
        html += "<div class=\\"diagnosis-stat-grid\\">";
        if (entry.lineCount != null) html += "<div class=\\"diagnosis-stat\\"><span class=\\"diagnosis-stat-label\\">LOC</span><span class=\\"diagnosis-stat-value\\">" + entry.lineCount + "</span></div>";
        if (entry.dependencyCount != null) html += "<div class=\\"diagnosis-stat\\"><span class=\\"diagnosis-stat-label\\">Deps</span><span class=\\"diagnosis-stat-value\\">" + entry.dependencyCount + "</span></div>";
        if (entry.componentRole) { var roleInfo = getRoleDisplayWithConfidence(entry.componentRole, entry.roleConfidence); html += "<div class=\\"diagnosis-stat\\"><span class=\\"diagnosis-stat-label\\">Role</span><span class=\\"diagnosis-stat-value\\">" + esc(roleInfo.display) + "</span></div>"; }
        if (entry.dominantIssue) { var lbl = typeof dt("issues." + entry.dominantIssue) === "string" ? dt("issues." + entry.dominantIssue) : (entry.dominantIssue || "").replace(/_/g, " "); html += "<div class=\\"diagnosis-stat\\"><span class=\\"diagnosis-stat-label\\">Primary</span><span class=\\"diagnosis-stat-value\\">" + esc(lbl) + "</span></div>"; }
        html += "</div>";
        var conf = entry.roleConfidence != null ? getConfidenceBucket(entry.roleConfidence) : (entry.decompositionSuggestion && entry.decompositionSuggestion.confidence != null ? getConfidenceBucket(entry.decompositionSuggestion.confidence) : null);
        if (conf) html += "<span class=\\"diagnosis-confidence-pill\\">" + (dt("confidenceLabels." + conf) || conf) + "</span>";
        if (entry.supportingIssues && entry.supportingIssues.length) {
          html += "<div class=\\"diagnosis-concerns-chips\\">";
          for (var i = 0; i < Math.min(entry.supportingIssues.length, 3); i++) {
            var c = entry.supportingIssues[i].replace(/_/g, " ");
            html += "<span class=\\"diagnosis-chip\\">" + esc(c) + "</span>";
          }
          html += "</div>";
        }
        html += "</div>";
        return html;
      }
      function renderRefactorPlan(entry, dt, esc, skipFirst) {
        var steps = getRefactorSteps(entry);
        if (skipFirst && steps.length > 1) steps = steps.slice(1);
        return renderRefactorPlanSteps(steps, dt, esc);
      }
      function renderRefactorPlanSteps(steps, dt, esc) {
        if (steps.length === 0) return "";
        var html = "<div class=\\"drawer-section drawer-refactor-plan\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.refactorPlan") || "Recommended refactor plan") + "</h4><ol class=\\"drawer-refactor-steps\\">";
        for (var st = 0; st < steps.length; st++) {
          var stepClass = st === 0 ? "drawer-refactor-step-first" : "";
          html += "<li class=\\"" + stepClass + "\\">" + esc(steps[st]) + "</li>";
        }
        return html + "</ol></div>";
      }
      function renderEvidenceBlock(entry, dt, esc) {
        var evidenceLabels = { lineCount: dt("evidence.lineCount"), constructorDependencies: dt("evidence.constructorDependencies"), methodCount: dt("evidence.methodCount"), propertyCount: dt("evidence.propertyCount"), templateLineCount: dt("evidence.templateLineCount"), structuralDirectiveCount: dt("evidence.structuralDirectiveCount"), eventBindingCount: dt("evidence.eventBindingCount"), structuralDepth: dt("evidence.structuralDepth"), subscriptionCount: dt("evidence.subscriptionCount"), timerUsage: dt("evidence.timerUsage"), eventListenerUsage: dt("evidence.eventListenerUsage"), lifecycleHookCount: dt("evidence.lifecycleHookCount"), formGroupCount: dt("evidence.formGroupCount"), serviceOrchestrationCount: dt("evidence.serviceOrchestrationCount"), dependencyCount: dt("evidence.dependencyCount") };
        var evidenceUnits = { lineCount: dt("evidenceUnits.lineCount"), templateLineCount: dt("evidenceUnits.templateLineCount"), constructorDependencies: dt("evidenceUnits.constructorDependencies"), dependencyCount: dt("evidenceUnits.dependencyCount") };
        var sizeKeys = ["lineCount", "constructorDependencies", "methodCount", "propertyCount", "dependencyCount"];
        var templateKeys = ["templateLineCount", "structuralDirectiveCount", "eventBindingCount", "structuralDepth"];
        var respKeys = ["serviceOrchestrationCount", "formGroupCount"];
        var lifeKeys = ["subscriptionCount", "timerUsage", "eventListenerUsage", "lifecycleHookCount"];
        function evidenceGroup(keys, title) {
          var items = [];
          if (entry.evidence && entry.evidence.length) {
            for (var ei = 0; ei < entry.evidence.length; ei++) {
              var e = entry.evidence[ei];
              if (keys.indexOf(e.key) >= 0) {
                var unit = evidenceUnits[e.key] || "";
                if (unit && unit.indexOf(".") >= 0) unit = "";
                items.push((evidenceLabels[e.key] || e.key) + ": " + e.value + (unit ? " " + unit : ""));
              }
            }
          }
          if (title === dt("drawer.sizeEvidence") && items.length === 0 && (entry.lineCount != null || entry.dependencyCount != null)) {
            if (entry.lineCount != null) items.push(dt("evidence.lineCount") + ": " + entry.lineCount);
            if (entry.dependencyCount != null) items.push(dt("evidence.dependencyCount") + ": " + entry.dependencyCount);
          }
          if (title === dt("drawer.templateEvidence") && items.length === 0 && entry.template) {
            var t = entry.template;
            if (t.lineCount != null) items.push(dt("evidence.templateLineCount") + ": " + t.lineCount);
            if (t.methodCallCount != null) items.push("Method calls: " + t.methodCallCount);
          }
          if (title === dt("drawer.responsibilityEvidence") && items.length === 0 && entry.responsibility && entry.responsibility.serviceOrchestrationCount != null) items.push(dt("evidence.serviceOrchestrationCount") + ": " + entry.responsibility.serviceOrchestrationCount);
          if (title === dt("drawer.lifecycleEvidence") && items.length === 0 && entry.lifecycle) {
            var l = entry.lifecycle;
            if (l.subscribeCount != null) items.push(dt("evidence.subscriptionCount") + ": " + l.subscribeCount);
          }
          if (items.length === 0) return "";
          return "<div class=\\"evidence-card\\"><h5 class=\\"drawer-evidence-group-title\\">" + title + "</h5><ul class=\\"drawer-evidence-list\\">" + items.map(function(i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
        }
        var html = "<div class=\\"drawer-section drawer-evidence-section\\"><h4 class=\\"drawer-section-title\\">" + dt("drawer.evidenceGroups") + "</h4>";
        if (entry.supportingIssues && entry.supportingIssues.length) {
          html += "<div class=\\"drawer-related-concerns drawer-concerns-chips\\">";
          for (var ci = 0; ci < Math.min(entry.supportingIssues.length, 5); ci++) html += "<span class=\\"evidence-chip\\">" + esc(entry.supportingIssues[ci].replace(/_/g, " ")) + "</span>";
          html += "</div>";
        }
        html += evidenceGroup(sizeKeys, dt("drawer.sizeEvidence")) + evidenceGroup(templateKeys, dt("drawer.templateEvidence")) + evidenceGroup(respKeys, dt("drawer.responsibilityEvidence")) + evidenceGroup(lifeKeys, dt("drawer.lifecycleEvidence")) + "</div>";
        return html;
      }
      function renderFileContext(entry, dt, esc) {
        var html = "<div class=\\"drawer-section drawer-file-context-section\\"><h4 class=\\"drawer-section-title\\">" + dt("drawer.fileContext") + "</h4><div class=\\"drawer-file-context\\">";
        if (entry.filePath) html += "<div class=\\"drawer-path-block\\"><code class=\\"drawer-path\\">" + esc(entry.filePath) + "</code><button type=\\"button\\" class=\\"drawer-path-copy\\" data-path=\\"" + esc(entry.filePath) + "\\" aria-label=\\"Copy path\\">" + (dt("drawer.copyPath") || "Copy") + "</button></div>";
        html += "<div class=\\"drawer-context-meta\\">";
        if (entry.sourceRoot) html += "<div class=\\"drawer-context-row\\"><span class=\\"drawer-context-label\\">" + dt("drawer.sourceRoot") + "</span><span class=\\"drawer-context-value\\">" + esc(entry.sourceRoot) + "</span></div>";
        if (entry.inferredFeatureArea) html += "<div class=\\"drawer-context-row\\"><span class=\\"drawer-context-label\\">" + dt("drawer.inferredFeatureArea") + "</span><span class=\\"drawer-context-value\\">" + esc(entry.inferredFeatureArea) + "</span></div>";
        if (entry.componentRole) { var roleCtx = getRoleDisplayWithConfidence(entry.componentRole, entry.roleConfidence); html += "<div class=\\"drawer-context-row\\"><span class=\\"drawer-context-label\\">" + dt("drawer.componentRole") + "</span><span class=\\"drawer-context-value\\">" + esc(roleCtx.display) + "</span></div>"; }
        return html + "</div></div></div>";
      }
      function renderRelatedRules(entry, dt, esc) {
        var ruleIds = entry.triggeredRuleIds || [];
        if (ruleIds.length === 0) return "";
        var ruleToAffected = window.__RULE_TO_AFFECTED__ || {};
        var filterListLabel = dt("rules.relatedRulesShowInList") || "Show in component list";
        var items = ruleIds.slice(0, 5).map(function(id) {
          var title = resolveRuleTitle(id);
          var count = (ruleToAffected[id] || []).length;
          var meta = count > 0 ? "<span class=\\"drawer-related-rule-meta\\">(" + count + ")</span>" : "";
          return "<li class=\\"drawer-related-rule-item\\"><div class=\\"drawer-related-rule-row\\"><button type=\\"button\\" class=\\"rule-drawer-detail-trigger drawer-related-rule-title-btn\\" data-rule-id=\\"" + esc(id) + "\\">" + esc(title) + "</button>" + meta + "</div><a href=\\"#components\\" class=\\"planner-nav-link drawer-related-rule-filter-link\\" data-nav=\\"components\\" data-rule-id=\\"" + esc(id) + "\\">" + esc(filterListLabel) + "</a></li>";
        }).join("");
        return "<div class=\\"drawer-section drawer-related-rules\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.relatedRules") || "Related rules") + "</h4><ul class=\\"drawer-related-rules-list\\">" + items + "</ul></div>";
      }
      function renderSimilarComponents(entry, dt, esc) {
        var pathToFamily = (typeof window.__PATH_TO_FAMILY__ !== "undefined" ? window.__PATH_TO_FAMILY__ : {}) || {};
        var pathKey = (entry.filePath || "").replace(/\\\\/g, "/");
        var familyInfo = pathToFamily[pathKey];
        if (!familyInfo) return "";
        var partOfLabel = dt("drawer.partOfFamily") || "Part of";
        var sharedRefactorLabel = dt("drawer.sharedRefactorOpportunity") || "Shared refactor opportunity";
        var html = "<div class=\\"drawer-section drawer-similar-components\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.similarComponents") || "Similar components / same family") + "</h4>";
        if (familyInfo.isExtraction) {
          html += "<p class=\\"drawer-family-badge\\"><span class=\\"badge badge-smell\\">" + esc(sharedRefactorLabel) + "</span></p>";
        }
        html += "<p class=\\"drawer-family-name\\">" + esc(partOfLabel) + " <strong>" + esc(familyInfo.familyName) + "</strong></p></div>";
        return html;
      }
      function renderComponentDetailContent(entry) {
        if (!entry) return "";
        var dt = getDrawerT;
        var html = "";
        var diagnosisLine = entry.refactorDirection || entry.diagnosticLabel || (entry.dominantIssue ? (dt("patternExplanations." + entry.dominantIssue + ".meaning") || "") : "");
        if (diagnosisLine) diagnosisLine = diagnosisLine.substring(0, 150) + (diagnosisLine.length > 150 ? "..." : "");
        if (!diagnosisLine && entry.__fallback) diagnosisLine = dt("drawer.fallbackDiagnosis") || "Detailed diagnostics unavailable for this component.";
        if (!diagnosisLine && !entry.dominantIssue) {
          if (entry.diagnosticStatus === "quiet") {
            diagnosisLine = dt("drawer.diagnosisQuiet") || "No primary ranked issue and no counted cross-analyzer warnings for this component.";
          } else if (entry.diagnosticStatus === "unranked") {
            diagnosisLine = dt("drawer.diagnosisUnranked") || "Findings exist, but none reached the threshold for a single primary ranked issue. Review rules and evidence in context.";
          } else {
            diagnosisLine = dt("drawer.noDominantIssueExplanation") || "Signals may be present; review evidence to decide where to focus.";
          }
        }
        html += "<div class=\\"drawer-section drawer-why-flagged\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.whyFlagged") || "Why flagged") + "</h4><p class=\\"drawer-diagnosis-line drawer-diagnosis-one-liner\\">" + esc(diagnosisLine) + "</p>";
        html += renderDiagnosisSummary(entry, dt, esc) + "</div>";
        var whyItMatters = entry.dominantIssue ? (dt("patternExplanations." + entry.dominantIssue + ".whyItMatters") || "") : "";
        if (whyItMatters) {
          var whyShort = whyItMatters.substring(0, 300) + (whyItMatters.length > 300 ? "..." : "");
          html += "<div class=\\"drawer-section drawer-why-matters\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.whyItMatters") || "Why it matters") + "</h4><p class=\\"drawer-why-text\\">" + esc(whyShort) + "</p></div>";
        }
        var steps = getRefactorSteps(entry);
        var firstRefactor = steps.length > 0 ? steps[0] : (entry.refactorDirection ? entry.refactorDirection.split(/[.;]/)[0] : null);
        if (firstRefactor) {
          html += "<div class=\\"drawer-section drawer-suggested-first-refactor\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.suggestedFirstRefactor") || "Suggested first refactor") + "</h4><p class=\\"drawer-first-refactor\\">" + esc(firstRefactor.trim()) + "</p></div>";
        }
        if (steps.length > 1) html += renderRefactorPlan(entry, dt, esc, true);
        html += renderRelatedRules(entry, dt, esc);
        html += renderSimilarComponents(entry, dt, esc);
        var expectedOutcomeByIssue = (window.__TRANSLATIONS__ && window.__TRANSLATIONS__.drawer && window.__TRANSLATIONS__.drawer.expectedOutcomeByIssue) || {};
        var expectedOutcomeText = (entry.dominantIssue && expectedOutcomeByIssue[entry.dominantIssue]) || dt("drawer.expectedOutcomeText") || "Lower complexity, clearer ownership, better testability.";
        html += "<div class=\\"drawer-section drawer-expected-outcome\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.expectedOutcome") || "Expected outcome") + "</h4><p class=\\"drawer-expected-text\\">" + esc(expectedOutcomeText) + "</p></div>";
        html += renderEvidenceBlock(entry, dt, esc);
        html += renderFileContext(entry, dt, esc);
        html += (function renderCompareMiniBlock() {
          function legacyNormalizeFileKey(fp) {
            return String(fp || "")
              .replace(/\\\\/g, "/")
              .toLowerCase();
          }
          var sr = entry.sourceRoot || "";
          var fp = entry.filePath || "";
          if (!sr || !fp) return "";
          var baselineMap = window.__baselineBySourceRoot__ || {};
          var idx = baselineMap[sr];
          if (idx == null || idx === undefined) return "";
          var bkey = baselineKeyFromHistoryIndex(idx);
          if (!bkey) return "";
          var comps = getSnapshotComparisons();
          var payload = comps[bkey];
          var pc = payload && payload.projectComparisons ? payload.projectComparisons[sr] : null;
          var ck = entry.compareComponentKey || legacyNormalizeFileKey(fp);
          var diff = pc && pc.componentChangesByKey ? pc.componentChangesByKey[ck] : null;
          if (!diff) return "";
          var tc = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.components;
          var tdraw = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.drawer;
          var title = (tdraw && tdraw.compareMiniTitle) || "Baseline comparison";
          var lblPw = (tc && tc.comparePrevWarnings) || "Previous warnings";
          var lblCw = (tc && tc.compareCurrWarnings) || "Current warnings";
          var lblPi = (tc && tc.comparePrevIssue) || "Previous issue";
          var lblCi = (tc && tc.compareCurrIssue) || "Current issue";
          var lblAdd = (tc && tc.compareAddedRules) || "Added rules";
          var lblRem = (tc && tc.compareRemovedRules) || "Removed rules";
          function fmtIssue(x) {
            return x ? String(x).replace(/_/g, " ") : "—";
          }
          var addRules = (diff.addedRules || [])
            .slice(0, 6)
            .map(function(rid) { return resolveRuleTitle(rid); })
            .filter(Boolean)
            .join(", ");
          var remRules = (diff.removedRules || [])
            .slice(0, 6)
            .map(function(rid) { return resolveRuleTitle(rid); })
            .filter(Boolean)
            .join(", ");
          return (
            "<div class=\\"drawer-section drawer-compare-mini\\"><h4 class=\\"drawer-section-title\\">" +
            esc(title) +
            "</h4><div class=\\"drawer-compare-mini-grid\\">" +
            "<div class=\\"drawer-compare-mini-row\\"><span>" +
            esc(lblPw) +
            "</span><span>" +
            esc(String(diff.previousWarningCount)) +
            "</span></div>" +
            "<div class=\\"drawer-compare-mini-row\\"><span>" +
            esc(lblCw) +
            "</span><span>" +
            esc(String(diff.currentWarningCount)) +
            "</span></div>" +
            "<div class=\\"drawer-compare-mini-row\\"><span>" +
            esc(lblPi) +
            "</span><span>" +
            esc(fmtIssue(diff.previousDominantIssue)) +
            "</span></div>" +
            "<div class=\\"drawer-compare-mini-row\\"><span>" +
            esc(lblCi) +
            "</span><span>" +
            esc(fmtIssue(diff.currentDominantIssue)) +
            "</span></div></div>" +
            (addRules ? "<p class=\\"drawer-compare-rules\\"><strong>" + esc(lblAdd) + ":</strong> " + esc(addRules) + "</p>" : "") +
            (remRules ? "<p class=\\"drawer-compare-rules\\"><strong>" + esc(lblRem) + ":</strong> " + esc(remRules) + "</p>" : "") +
            "</div>"
          );
        })();

        var analysisNotes = [];
        if (entry.severityTrustSummary) analysisNotes.push(entry.severityTrustSummary);
        if (entry.severityNotesForDisplay && entry.severityNotesForDisplay.length) {
          var sevTitle = dt("drawer.severityAssessmentTitle") || "Severity assessment";
          html += "<div class=\\"drawer-section drawer-severity-notes drawer-meta-muted\\"><h4 class=\\"drawer-section-title\\">" + esc(sevTitle) + "</h4><ul class=\\"drawer-analysis-notes-list\\">";
          for (var sn = 0; sn < entry.severityNotesForDisplay.length; sn++) {
            html += "<li>" + esc(entry.severityNotesForDisplay[sn]) + "</li>";
          }
          html += "</ul></div>";
        }
        if (entry.roleConfidence != null && entry.roleConfidence < 0.4) {
          analysisNotes.push(dt("drawer.drawerRoleHeuristicHelper") || "Role derived from naming and structural signals.");
        }
        if (analysisNotes.length) {
          var analysisNotesTitle = dt("drawer.drawerWhyThisClassification") || dt("components.drawerWhyThisClassification") || "Why this classification?";
          html += "<div class=\\"drawer-section drawer-analysis-notes drawer-meta-muted\\"><h4 class=\\"drawer-section-title\\">" + esc(analysisNotesTitle) + "</h4><ul class=\\"drawer-analysis-notes-list\\">";
          for (var an = 0; an < analysisNotes.length; an++) html += "<li>" + esc(analysisNotes[an]) + "</li>";
          html += "</ul></div>";
        }

        var hasHeuristics = (entry.roleConfidence != null && entry.roleConfidenceBreakdown) || (entry.decompositionSuggestion && entry.decompositionSuggestion.confidence != null) || (entry.lifecycle && Object.keys(entry.lifecycle).length) || (entry.template && Object.keys(entry.template).length) || (entry.responsibility && Object.keys(entry.responsibility).length);
        if (hasHeuristics) {
          var roleConf = entry.roleConfidence != null ? getConfidenceBucket(entry.roleConfidence) : null;
          var decompConf = entry.decompositionSuggestion && entry.decompositionSuggestion.confidence != null ? getConfidenceBucket(entry.decompositionSuggestion.confidence) : null;
          var summaryParts = [];
          if (roleConf) summaryParts.push("Role: " + (dt("confidenceLabels." + roleConf) || roleConf));
          if (decompConf) summaryParts.push("Decomposition: " + (dt("confidenceLabels." + decompConf) || decompConf));
          var viewSignals = dt("drawer.viewSupportingSignals") || "View supporting signals";
          var heurSummary = summaryParts.length ? summaryParts.join(" · ") + " · " + viewSignals : viewSignals;
          html += "<details class=\\"drawer-collapsible drawer-heuristics\\"><summary>" + heurSummary + "</summary><div class=\\"drawer-section-content\\">";
          if (entry.roleConfidence != null) {
            html += "<div class=\\"drawer-heuristic-item\\"><span>Role confidence</span><div class=\\"drawer-heuristic-badge-wrap\\">" + renderConfidenceBadge(entry.roleConfidence, entry.roleConfidenceBreakdown);
            if (entry.roleConfidence < 0.4) html += "<p class=\\"drawer-confidence-helper\\">" + (dt("drawer.roleConfidenceLowHelper") || "Role inference is based mostly on naming with limited supporting signals.") + "</p>";
            html += "</div>";
            var breakdown = entry.roleConfidenceBreakdown;
            if (breakdown && breakdown.contributingSignals && breakdown.contributingSignals.length) {
              var matchedSignals = breakdown.contributingSignals.filter(function(s) { return s && s.matched; });
              if (matchedSignals.length) {
                html += "<div class=\\"drawer-heuristic-role-explanation\\"><h5 class=\\"drawer-subtitle\\">Why this role was inferred</h5><ul class=\\"drawer-signals\\">";
                for (var rs = 0; rs < Math.min(matchedSignals.length, 4); rs++) {
                  var sig = matchedSignals[rs];
                  if (!sig) continue;
                  var label = getSignalDisplayLabel(sig.signal || "", sig.note || "");
                  html += "<li>" + esc(label) + "</li>";
                }
                html += "</ul></div>";
              }
            }
            html += "</div>";
          }
          if (entry.decompositionSuggestion && entry.decompositionSuggestion.confidence != null) {
            html += "<div class=\\"drawer-heuristic-item\\"><span>Decomposition confidence</span><div class=\\"drawer-heuristic-badge-wrap\\">" + renderConfidenceBadge(entry.decompositionSuggestion.confidence, entry.decompositionSuggestion.confidenceBreakdown);
            if (entry.decompositionSuggestion.confidence < 0.4) html += "<p class=\\"drawer-confidence-helper\\">" + (dt("drawer.decompositionConfidenceLowHelper") || "Decomposition suggestion is based on limited evidence.") + "</p>";
            html += "</div></div>";
          }
          if (entry.lifecycle && Object.keys(entry.lifecycle).length) {
            var l = entry.lifecycle;
            html += "<h5 class=\\"drawer-subtitle\\">" + dt("drawer.lifecycle") + "</h5><div class=\\"drawer-metrics\\">";
            if (l.subscribeCount != null) html += "<div class=\\"metric\\"><span>Subscriptions</span><span class=\\"metric-value\\">" + l.subscribeCount + "</span></div>";
            if (l.riskySubscribeCount != null) html += "<div class=\\"metric\\"><span>Risky subs</span><span class=\\"metric-value\\">" + l.riskySubscribeCount + "</span></div>";
            if (l.addEventListenerCount != null) html += "<div class=\\"metric\\"><span>Listeners</span><span class=\\"metric-value\\">" + l.addEventListenerCount + "</span></div>";
            html += "</div>";
          }
          if (entry.template && Object.keys(entry.template).length) {
            var tmpl = entry.template;
            html += "<h5 class=\\"drawer-subtitle\\">" + dt("drawer.template") + "</h5><div class=\\"drawer-metrics\\">";
            if (tmpl.lineCount != null) html += "<div class=\\"metric\\"><span>Template lines</span><span class=\\"metric-value\\">" + tmpl.lineCount + "</span></div>";
            if (tmpl.methodCallCount != null) html += "<div class=\\"metric\\"><span>Method calls</span><span class=\\"metric-value\\">" + tmpl.methodCallCount + "</span></div>";
            html += "</div>";
          }
          if (entry.responsibility && Object.keys(entry.responsibility).length) {
            var r = entry.responsibility;
            html += "<h5 class=\\"drawer-subtitle\\">" + dt("drawer.responsibility") + "</h5><div class=\\"drawer-metrics\\">";
            if (r.serviceOrchestrationCount != null) html += "<div class=\\"metric\\"><span>Orchestration</span><span class=\\"metric-value\\">" + r.serviceOrchestrationCount + "</span></div>";
            html += "</div>";
          }
          var hasMatchedInBreakdown = entry.roleConfidenceBreakdown && entry.roleConfidenceBreakdown.contributingSignals && entry.roleConfidenceBreakdown.contributingSignals.some(function(s) { return s.matched; });
          if (entry.roleSignals && entry.roleSignals.length && !hasMatchedInBreakdown) {
            html += "<h5 class=\\"drawer-subtitle\\">Signals</h5><ul class=\\"drawer-signals\\">";
            for (var si = 0; si < entry.roleSignals.length; si++) html += "<li>" + esc(getSignalDisplayLabel(entry.roleSignals[si], "")) + "</li>";
            html += "</ul>";
          }
          html += "</div></details>";
        }
        var actions = getAvailableDetailActions(entry, detailModalSourceContext);
        if (actions.length > 0) {
          var nextStepActions = "<div class=\\"drawer-next-actions\\">" + actions.map(function(a){ return a.html; }).join("") + "</div>";
          html += "<div class=\\"drawer-section drawer-actions-section\\"><h4 class=\\"drawer-section-title\\">" + (dt("drawer.nextSteps") || "Next steps") + "</h4>" + nextStepActions + "</div>";
        }
        return html;
      }

      function bindDetailActions() {
        document.addEventListener("click", function(e) {
          var exploreBtn = e.target.closest && e.target.closest(".explore-minor-areas-btn");
          if (exploreBtn) {
            e.preventDefault();
            e.stopPropagation();
            var dt = getDrawerT;
            var bdm = window.__BREAKDOWN_MODE__ || "feature-area";
            var minorTitle = bdm === "feature-area" ? (dt("overview.smallerFeatureAreas") || "Smaller feature areas") : (dt("overview.minorClusters") || "Minor clusters");
            openDetail({ type: "minorAreas", id: "minor", title: minorTitle, subtitle: "" });
            return;
          }
          var el = e.target.closest && e.target.closest("[data-file-path]");
          if (!el) return;
          var path = el.getAttribute("data-file-path");
          if (!path) return;
          e.preventDefault();
          e.stopPropagation();
          var isInsideModal = detailModalBody && el.closest && el.closest("#detail-modal-body");
          var entry = getDetailEntry(path) || createFallbackEntry(path);
          var payload = { type: "component", id: path, title: (entry.className || entry.fileName || "Component") + " — Details", subtitle: buildComponentSubtitle(entry) };
          if (isInsideModal) pushDetail(payload); else openDetail(payload);
        });
      }
      bindDetailActions();

      if (detailModalBack) detailModalBack.addEventListener("click", goBack);
      if (detailModalClose) detailModalClose.addEventListener("click", closeDetailModal);
      if (detailModalOverlay) detailModalOverlay.addEventListener("click", function(e) { if (e.target === detailModalOverlay) closeDetailModal(); });
      document.addEventListener("keydown", function(e) { if (e.key === "Escape") closeDetailModal(); });

      detailModalBody && detailModalBody.addEventListener("click", function(e) {
        var pathEl = e.target && e.target.closest ? e.target.closest("[data-file-path]") : null;
        if (pathEl) {
          var path = pathEl.getAttribute("data-file-path");
          if (path) { e.preventDefault(); e.stopPropagation(); var entry = getDetailEntry(path) || createFallbackEntry(path); pushDetail({ type: "component", id: path, title: entry.fileName || (entry.filePath && entry.filePath.split(/[/\\\\]/).pop()) || "Component", subtitle: buildComponentSubtitle(entry) }); }
        }
        var patternEl = e.target && e.target.closest ? e.target.closest("[data-pattern-key]") : null;
        if (patternEl) {
          var key = patternEl.getAttribute("data-pattern-key");
          if (key) { e.preventDefault(); e.stopPropagation(); var patternData = window.__PATTERN_DATA__; var pattern = patternData && patternData.patterns && patternData.patterns[key]; var patternSubtitle = "Pattern"; if (pattern && pattern.meta) { var m = pattern.meta; var parts = [(m.impactLevel || "").charAt(0).toUpperCase() + (m.impactLevel || "").slice(1) + " impact", m.count ? m.count + " components" : ""].filter(Boolean); if (m.topArea) parts.push("Most in " + m.topArea); patternSubtitle = parts.join(" · ") || "Pattern"; } pushDetail({ type: "pattern", id: key, title: pattern ? pattern.name : key, subtitle: patternSubtitle }); }
        }
        var ruleTrig = e.target && e.target.closest ? e.target.closest(".rule-drawer-detail-trigger") : null;
        if (ruleTrig) {
          var rid = ruleTrig.getAttribute("data-rule-id");
          if (rid) { e.preventDefault(); e.stopPropagation(); pushDetail({ type: "rule", id: rid, title: resolveRuleTitle(rid), subtitle: "Rule" }); }
        }
        var concernEl = e.target && e.target.closest ? e.target.closest("[data-concern-type]") : null;
        if (concernEl) {
          var concernType = concernEl.getAttribute("data-concern-type");
          var concernTitle = concernEl.querySelector ? (concernEl.querySelector(".rule-card-title") || concernEl).textContent : concernEl.textContent;
          if (concernType) { e.preventDefault(); e.stopPropagation(); pushDetail({ type: "structure", id: concernType, title: concernTitle || concernType, subtitle: "Structure Concern" }); }
        }
      });

      document.querySelectorAll(".tab-bar .tab").forEach(function(tab) {
        tab.addEventListener("click", function() {
          var tabId = tab.getAttribute("data-tab");
          document.querySelectorAll(".tab-bar .tab").forEach(function(t) { t.classList.remove("active"); });
          document.querySelectorAll(".tab-panel").forEach(function(p) { p.classList.remove("active"); });
          tab.classList.add("active");
          var panel = document.getElementById("tab-panel-" + tabId);
          if (panel) panel.classList.add("active");
        });
      });

      function doExport() {
        try {
          var currentPage = window.__CURRENT_PAGE__ || "overview";
          document.body.setAttribute("data-initial-page", currentPage);
          var html = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
          document.body.removeAttribute("data-initial-page");
          var wp = (window.__REPORT_META__ && window.__REPORT_META__.workspacePath) || "";
          var segments = wp.replace(/\\\\/g, "/").replace(/\\/$/, "").split("/");
          var baseName = segments.length ? segments[segments.length - 1] : "report";
          var sanitized = baseName.replace(/[\\\\/:*?"<>|]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "report";
          var filename = "modulens-angular-report-" + sanitized + ".html";
          var blob = new Blob([html], { type: "text/html; charset=utf-8" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = filename;
          a.click();
          URL.revokeObjectURL(a.href);
        } catch (err) {
          console.error("[Modulens] Export failed:", err);
          if (typeof alert === "function") alert("Export failed. Please try again or check the console.");
        }
      }
      document.getElementById("export-report-btn")?.addEventListener("click", doExport);

      document.addEventListener("click", function(e) {
        var fixFirstShowMore = e.target && e.target.closest ? e.target.closest(".fix-first-show-more-btn") : null;
        if (fixFirstShowMore) {
          e.preventDefault();
          e.stopPropagation();
          var section = document.querySelector(".fix-first-section");
          if (section) {
            section.querySelectorAll(".fix-first-card-hidden").forEach(function(el) {
              el.classList.remove("fix-first-card-hidden");
              el.setAttribute("data-fix-first-expanded", "true");
            });
            fixFirstShowMore.setAttribute("aria-expanded", "true");
            fixFirstShowMore.closest(".fix-first-show-more-wrap")?.remove();
          }
          return;
        }
        var showMoreBtn = e.target && e.target.closest ? e.target.closest(".planner-show-more-btn") : null;
        if (showMoreBtn) {
          e.preventDefault();
          e.stopPropagation();
          var list = document.querySelector(".planner-targets-list");
          if (list) {
            list.querySelectorAll(".planner-target-hidden").forEach(function(el) { el.classList.remove("planner-target-hidden"); });
            showMoreBtn.style.display = "none";
          }
          return;
        }
        var pathCopyBtn = e.target && e.target.closest ? e.target.closest(".refactor-target-path-copy") : null;
        if (pathCopyBtn) {
          e.preventDefault();
          e.stopPropagation();
          var pathToCopy = pathCopyBtn.getAttribute("data-copy-path");
          var t = window.__TRANSLATIONS__;
          var copySuccessPathLabel = (t && t.actions && t.actions.copySuccessPath) || "File path copied";
          copyToClipboard(pathToCopy, pathCopyBtn, copySuccessPathLabel, "Copy");
          return;
        }
        var copyBtn = e.target && e.target.closest ? e.target.closest(".copy-refactor-steps-btn") : null;
        if (copyBtn) {
          e.preventDefault();
          e.stopPropagation();
          var stepsJson = copyBtn.getAttribute("data-copy-steps");
          if (stepsJson) {
            try {
              var steps = JSON.parse(stepsJson);
              var text = Array.isArray(steps) ? steps.join("\\n") : stepsJson;
              var t = window.__TRANSLATIONS__;
              var copySuccessStepsLabel = (t && t.actions && t.actions.copySuccessSteps) || "Refactor steps copied";
              copyToClipboard(text, copyBtn, copySuccessStepsLabel, "Copy steps");
            } catch (err) {}
          }
          return;
        }
        var expandBtn = e.target && e.target.closest ? e.target.closest(".extraction-expand-btn") : null;
        if (expandBtn) {
          e.preventDefault();
          e.stopPropagation();
          var expandId = expandBtn.getAttribute("data-expand-id");
          if (expandId) {
            var container = document.querySelector(".extraction-affected[data-expand-id=\\"" + expandId + "\\"]");
            if (container) {
              var expanded = container.classList.contains("extraction-affected-expanded");
              if (expanded) {
                container.classList.remove("extraction-affected-expanded");
                expandBtn.setAttribute("aria-expanded", "false");
                var moreCount = (container.querySelectorAll(".extraction-chip-hidden").length || 0);
                expandBtn.textContent = "+" + moreCount + " more";
              } else {
                container.classList.add("extraction-affected-expanded");
                expandBtn.setAttribute("aria-expanded", "true");
                expandBtn.textContent = "Show less";
              }
            }
          }
          return;
        }
        var navLink = e.target && e.target.closest ? e.target.closest(".planner-nav-link") : null;
        if (navLink) {
          e.preventDefault();
          e.stopPropagation();
          var nav = navLink.getAttribute("data-nav");
          var search = navLink.getAttribute("data-search");
          var ruleId = navLink.getAttribute("data-rule-id");
          var structureConcern = navLink.getAttribute("data-structure-concern");
          var issueType = navLink.getAttribute("data-issue-type");
          var plannerSection = navLink.getAttribute("data-planner-section");
          if (nav && VALID_PAGES.indexOf(nav) >= 0) {
            closeDetailModal();
            showPage(nav);
            window.location.hash = nav;
            if (nav === "planner" && plannerSection) {
              requestAnimationFrame(function() {
                var sectionEl = document.getElementById(plannerSection);
                if (sectionEl) sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }
            if (nav === "components") {
              var si = document.getElementById("components-search");
              var ruleFilterEl = document.getElementById("filter-rule-id");
              var structureFilterEl = document.getElementById("filter-structure-concern");
              var projectFilterEl = document.getElementById("filter-project");
              var issueFilterEl = document.getElementById("filter-issue-type");
              var severityFilterEl = document.getElementById("filter-severity");
              var showHealthyCheckbox = document.getElementById("show-healthy-components");
              if (si) si.value = "";
              if (ruleFilterEl) ruleFilterEl.value = "";
              if (structureFilterEl) structureFilterEl.value = "";
              if (projectFilterEl) projectFilterEl.value = "";
              if (issueFilterEl) issueFilterEl.value = "all";
              if (severityFilterEl) severityFilterEl.value = "all";
              if (showHealthyCheckbox) showHealthyCheckbox.checked = false;
              if (search && si) si.value = search;
              if (ruleId && ruleFilterEl) {
                ruleFilterEl.value = ruleId;
                if (showHealthyCheckbox) showHealthyCheckbox.checked = true;
              }
              if (structureConcern && structureFilterEl) structureFilterEl.value = structureConcern;
              var projectFilter = navLink.getAttribute("data-project");
              if (projectFilter && projectFilterEl) projectFilterEl.value = projectFilter;
              if (issueType && issueFilterEl) {
                issueFilterEl.value = issueType;
                if (showHealthyCheckbox) showHealthyCheckbox.checked = true;
              }
              currentPage = 0;
              if (typeof applyComponentsExplorerFilters === "function") applyComponentsExplorerFilters();
            }
          }
          return;
        }
      });

      (function initSnapshotComparePicker() {
        var modal = document.getElementById("snapshot-compare-modal");
        var detailModal = document.getElementById("project-compare-detail-modal");
        var detailModalBody = document.getElementById("project-compare-detail-modal-body");
        var detailModalTitle = document.getElementById("project-compare-detail-modal-title");
        var listEl = document.querySelector("[data-snapshot-compare-list]");
        var pickerSourceRoot = null;

        function closeProjectCompareDetailModal() {
          if (!detailModal || detailModal.hasAttribute("hidden")) return;
          detailModal.setAttribute("hidden", "hidden");
          detailModal.setAttribute("aria-hidden", "true");
          if (detailModalBody) detailModalBody.innerHTML = "";
        }
        window.__closeProjectCompareDetailModal__ = closeProjectCompareDetailModal;
        var baselineBySourceRoot = {};
        window.__baselineBySourceRoot__ = baselineBySourceRoot;
        window.__activeCompareContext__ = window.__activeCompareContext__ || null;

        function getHistory() {
          return Array.isArray(window.__SNAPSHOT_HISTORY__) ? window.__SNAPSHOT_HISTORY__ : [];
        }

        function findStatusEl(sourceRoot) {
          var nodes = document.querySelectorAll("[data-project-compare-status]");
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getAttribute("data-source-root") === sourceRoot) return nodes[i];
          }
          return null;
        }

        function findDiffEl(sourceRoot) {
          var nodes = document.querySelectorAll("[data-project-compare-diff]");
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getAttribute("data-source-root") === sourceRoot) return nodes[i];
          }
          return null;
        }

        function findToggleEl(sourceRoot) {
          var nodes = document.querySelectorAll("[data-project-compare-toggle-details]");
          for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getAttribute("data-source-root") === sourceRoot) return nodes[i];
          }
          return null;
        }

        function getComparisons() {
          if (typeof window.__SNAPSHOT_COMPARISONS__ === "object" && window.__SNAPSHOT_COMPARISONS__ !== null) {
            return window.__SNAPSHOT_COMPARISONS__;
          }
          return {};
        }

        function baselineKeyFromIndex(idx) {
          var hist = getHistory();
          var s = hist[idx];
          if (!s) return null;
          if (s.snapshotHash) return s.snapshotHash;
          if (s.runId) return s.runId;
          return null;
        }

        function formatSigned(n) {
          if (typeof n !== "number" || isNaN(n)) return "0";
          if (n > 0) return "+" + n;
          return String(n);
        }

        function formatSignedFloat(n) {
          if (typeof n !== "number" || isNaN(n)) return "0";
          if (n > 0) return "+" + n.toFixed(1);
          if (n < 0) return n.toFixed(1);
          return "0";
        }

        function clearProjectComparePanel(diffEl) {
          closeProjectCompareDetailModal();
          if (!diffEl) return;
          var sr = diffEl.getAttribute("data-source-root");
          diffEl.innerHTML = "";
          diffEl.hidden = true;
          var tg = sr ? findToggleEl(sr) : null;
          if (tg) {
            tg.hidden = true;
            tg.setAttribute("aria-expanded", "false");
            var tFilC = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.filters;
            tg.textContent = (tFilC && tFilC.projectCompareViewDetails) || "View details";
          }
        }

        function renderProjectCompareDetailsBody(pc, payload, sourceRoot, omitHeader) {
          var sd = pc.summaryDeltas || {};
          var fnShort = window.__formatProjectShortName__ || function(x) { return x || ""; };
          var shortP = fnShort(sourceRoot);
          var tFilH = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.filters;
          var titleTpl = (tFilH && tFilH.projectCompareDetailsTitle) || "{project} — compare details";
          var secMetrics = (tFilH && tFilH.projectCompareSectionMetrics) || "Summary";
          var secDim = (tFilH && tFilH.projectCompareSectionDimensions) || "Findings by dimension";
          var secHigh = (tFilH && tFilH.projectCompareSectionHighlights) || "Highlights";
          var lblFd = (tFilH && tFilH.projectCompareLabelFindingsDelta) || "Findings Δ";
          var lblWo = (tFilH && tFilH.projectCompareLabelWorsened) || "Worsened";
          var lblIm = (tFilH && tFilH.projectCompareLabelImproved) || "Improved";
          var lblRe = (tFilH && tFilH.projectCompareLabelResolved) || "Resolved";
          var lblDc = (tFilH && tFilH.projectCompareDimComponent) || "Component";
          var lblDl = (tFilH && tFilH.projectCompareDimLifecycle) || "Lifecycle";
          var lblDt = (tFilH && tFilH.projectCompareDimTemplate) || "Template";
          var lblDr = (tFilH && tFilH.projectCompareDimResponsibility) || "Responsibility";
          var lblTopReg = (tFilH && tFilH.projectCompareTopRegressions) || "Largest regressions";
          var lblTopImp = (tFilH && tFilH.projectCompareTopImprovements) || "Largest improvements";
          var lblRuUp = (tFilH && tFilH.projectCompareRulesIncreasing) || "Rules increasing";
          var lblRuDn = (tFilH && tFilH.projectCompareRulesDecreasing) || "Rules decreasing";
          var warnTpl = (tFilH && tFilH.projectCompareWarningsDelta) || "{n} warnings";
          function warnDelta(signedPart) {
            return esc(warnTpl.replace("{n}", signedPart));
          }
          var headerHtml = omitHeader
            ? ""
            : "<header class=\\"project-compare-details-header\\"><h3 class=\\"project-compare-details-heading\\">" +
              esc(titleTpl.replace("{project}", shortP)) +
              "</h3></header>";
          var pFindingsDelta =
            (sd.componentFindings || 0) +
            (sd.lifecycleFindings || 0) +
            (sd.templateFindings || 0) +
            (sd.responsibilityFindings || 0);
          function chipStacked(valueHtml, label, extraClass) {
            var cls = "project-compare-detail-chip project-compare-detail-chip--stacked" + (extraClass ? " " + extraClass : "");
            return (
              "<span class=\\"" + cls + "\\">" +
              "<span class=\\"project-compare-detail-chip-value\\">" +
              valueHtml +
              "</span>" +
              "<span class=\\"project-compare-detail-chip-label\\">" +
              esc(label) +
              "</span></span>"
            );
          }
          var chipsHtml =
            "<section class=\\"project-compare-detail-section project-compare-detail-section--metrics\\" aria-labelledby=\\"project-compare-sec-metrics\\">" +
            "<h4 id=\\"project-compare-sec-metrics\\" class=\\"project-compare-detail-section-title\\">" +
            esc(secMetrics) +
            "</h4>" +
            "<div class=\\"project-compare-detail-chips\\" role=\\"group\\">" +
            chipStacked(esc(formatSigned(pFindingsDelta)), lblFd, "") +
            chipStacked(String(pc.worsenedCount || 0), lblWo, "project-compare-detail-chip-worse") +
            chipStacked(String(pc.improvedCount || 0), lblIm, "project-compare-detail-chip-better") +
            chipStacked(String(pc.resolvedCount || 0), lblRe, "") +
            "</div></section>";
          var dimInner =
            "<div class=\\"project-compare-dimensions project-compare-dimensions--grid\\">" +
            "<div class=\\"project-compare-dim-row\\"><span class=\\"project-compare-dim-label\\">" +
            esc(lblDc) +
            "</span><span class=\\"project-compare-dim-value\\">" +
            esc(formatSigned(sd.componentFindings || 0)) +
            "</span></div>" +
            "<div class=\\"project-compare-dim-row\\"><span class=\\"project-compare-dim-label\\">" +
            esc(lblDl) +
            "</span><span class=\\"project-compare-dim-value\\">" +
            esc(formatSigned(sd.lifecycleFindings || 0)) +
            "</span></div>" +
            "<div class=\\"project-compare-dim-row\\"><span class=\\"project-compare-dim-label\\">" +
            esc(lblDt) +
            "</span><span class=\\"project-compare-dim-value\\">" +
            esc(formatSigned(sd.templateFindings || 0)) +
            "</span></div>" +
            "<div class=\\"project-compare-dim-row\\"><span class=\\"project-compare-dim-label\\">" +
            esc(lblDr) +
            "</span><span class=\\"project-compare-dim-value\\">" +
            esc(formatSigned(sd.responsibilityFindings || 0)) +
            "</span></div></div>";
          var dimSection =
            "<section class=\\"project-compare-detail-section project-compare-detail-section--dimensions\\" aria-labelledby=\\"project-compare-sec-dim\\">" +
            "<h4 id=\\"project-compare-sec-dim\\" class=\\"project-compare-detail-section-title\\">" +
            esc(secDim) +
            "</h4>" +
            dimInner +
            "</section>";

          function listSection(title, items, kind) {
            if (!items || items.length === 0) return "";
            var rows = items.slice(0, 5)
              .map(function(it) {
                var name = it.className || it.filePath || "";
                var signed =
                  kind === "worse"
                    ? formatSigned((it.currentWarningCount || 0) - (it.previousWarningCount || 0))
                    : formatSigned((it.previousWarningCount || 0) - (it.currentWarningCount || 0));
                var sub = warnDelta(signed);
                return (
                  "<li><span class=\\"project-compare-comp-name\\">" +
                  esc(name) +
                  "</span> <span class=\\"project-compare-comp-meta\\">" +
                  sub +
                  "</span></li>"
                );
              })
              .join("");
            return (
              "<div class=\\"project-compare-list-block\\"><div class=\\"project-compare-list-title\\">" +
              esc(title) +
              "</div><ul class=\\"project-compare-comp-list\\">" +
              rows +
              "</ul></div>"
            );
          }

          function ruleList(title, rows) {
            if (!rows || rows.length === 0) return "";
            var lis = rows
              .map(function(r) {
                return (
                  "<li><span class=\\"project-compare-rule-id\\">" +
                  esc(resolveRuleTitle(r.ruleId)) +
                  "</span> <span class=\\"project-compare-rule-delta\\">" +
                  esc(formatSigned(r.delta)) +
                  "</span></li>"
                );
              })
              .join("");
            return (
              "<div class=\\"project-compare-list-block\\"><div class=\\"project-compare-list-title\\">" +
              esc(title) +
              "</div><ul class=\\"project-compare-rule-list\\">" +
              lis +
              "</ul></div>"
            );
          }
          var colA = listSection(lblTopReg, pc.topWorsenedComponents, "worse") + listSection(lblTopImp, pc.topImprovedComponents, "better");
          var colB = ruleList(lblRuUp, pc.topRuleIncreases) + ruleList(lblRuDn, pc.topRuleDecreases);
          var twoCol =
            "<section class=\\"project-compare-detail-section project-compare-detail-section--lists\\" aria-labelledby=\\"project-compare-sec-high\\">" +
            "<h4 id=\\"project-compare-sec-high\\" class=\\"project-compare-detail-section-title project-compare-detail-section-title--full\\">" +
            esc(secHigh) +
            "</h4>" +
            "<div class=\\"project-compare-details-columns\\">" +
            "<div class=\\"project-compare-details-col\\">" +
            colA +
            "</div>" +
            "<div class=\\"project-compare-details-col\\">" +
            colB +
            "</div>" +
            "</div></section>";
          return (
            "<div class=\\"project-compare-details-inner" +
            (omitHeader ? " project-compare-details-inner--modal" : "") +
            "\\">" +
            headerHtml +
            chipsHtml +
            dimSection +
            twoCol +
            "</div>"
          );
        }

        function openProjectCompareDetailModal(sourceRoot) {
          if (!detailModal || !detailModalBody) return;
          closeModal();
          var idxD = baselineBySourceRoot[sourceRoot];
          var keyD = idxD != null && idxD !== undefined ? baselineKeyFromIndex(idxD) : null;
          var payloadD = keyD ? getComparisons()[keyD] : null;
          var tFilD = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.filters;
          var fnShortD = window.__formatProjectShortName__ || function(x) { return x || ""; };
          var shortPD = fnShortD(sourceRoot);
          var titleTplD = (tFilD && tFilD.projectCompareDetailsTitle) || "{project} — compare details";
          if (detailModalTitle) detailModalTitle.textContent = titleTplD.replace("{project}", shortPD);
          if (!payloadD) {
            var msgUD = (tFilD && tFilD.projectCompareUnavailable) || "Compare data is not available for this baseline.";
            detailModalBody.innerHTML = "<div class=\\"project-compare-modal-empty\\">" + esc(msgUD) + "</div>";
            detailModal.removeAttribute("hidden");
            detailModal.setAttribute("aria-hidden", "false");
            return;
          }
          var pcD = payloadD.projectComparisons ? payloadD.projectComparisons[sourceRoot] : null;
          if (!pcD) {
            var msgND = (tFilD && tFilD.projectCompareNoDiff) || "No snapshot changes for this project.";
            detailModalBody.innerHTML = "<div class=\\"project-compare-modal-empty\\">" + esc(msgND) + "</div>";
            detailModal.removeAttribute("hidden");
            detailModal.setAttribute("aria-hidden", "false");
            return;
          }
          detailModalBody.innerHTML = renderProjectCompareDetailsBody(pcD, payloadD, sourceRoot, true);
          detailModal.removeAttribute("hidden");
          detailModal.setAttribute("aria-hidden", "false");
        }

        function renderProjectComparePanel(diffEl, sourceRoot, payload) {
          if (!diffEl) return;
          var toggleBtn = findToggleEl(sourceRoot);
          var tFil = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.filters;
          var msgUnavailable = (tFil && tFil.projectCompareUnavailable) || "Compare data is not available for this baseline.";
          var msgNoDiff = (tFil && tFil.projectCompareNoDiff) || "No snapshot changes for this project.";
          var lblView = (tFil && tFil.projectCompareViewDetails) || "View details";
          if (toggleBtn) {
            toggleBtn.hidden = true;
            toggleBtn.textContent = lblView;
          }
          if (!payload) {
            diffEl.hidden = false;
            diffEl.innerHTML = "<div class=\\"project-compare-diff-inner project-compare-diff-inner-compact\\"><div class=\\"project-compare-diff-warning\\">" + esc(msgUnavailable) + "</div></div>";
            return;
          }
          var pc = payload.projectComparisons ? payload.projectComparisons[sourceRoot] : null;
          if (!pc) {
            diffEl.hidden = false;
            diffEl.innerHTML = "<div class=\\"project-compare-diff-inner project-compare-diff-inner-compact\\"><div class=\\"project-compare-diff-empty\\">" + esc(msgNoDiff) + "</div></div>";
            return;
          }
          var sd = pc.summaryDeltas || {};
          var ws = payload.workspace || {};
          var pFindingsDelta =
            (sd.componentFindings || 0) +
            (sd.lifecycleFindings || 0) +
            (sd.templateFindings || 0) +
            (sd.responsibilityFindings || 0);
          var overallD = ws.overallScore && typeof ws.overallScore.delta === "number" ? ws.overallScore.delta : 0;
          var compactParts = [];
          compactParts.push("<div class=\\"project-compare-diff-inner project-compare-diff-inner-compact\\">");
          compactParts.push(
            "<div class=\\"project-compare-card-metrics\\" role=\\"group\\">" +
              "<span class=\\"project-compare-card-chip project-compare-card-chip-findings\\">" +
              esc(formatSigned(pFindingsDelta)) +
              " findings Δ</span>" +
              "<span class=\\"project-compare-card-chip\\">" +
              esc(formatSignedFloat(overallD)) +
              " overall</span>" +
              "<span class=\\"project-compare-card-chip project-compare-card-chip-worse\\">" +
              String(pc.worsenedCount) +
              " worsened</span>" +
              "<span class=\\"project-compare-card-chip project-compare-card-chip-better\\">" +
              String(pc.improvedCount) +
              " improved</span>" +
              "<span class=\\"project-compare-card-chip\\">" +
              String(pc.resolvedCount) +
              " resolved</span>" +
              "</div>"
          );
          compactParts.push("</div>");
          diffEl.innerHTML = compactParts.join("");
          diffEl.hidden = false;
          if (toggleBtn) {
            toggleBtn.hidden = false;
          }
        }

        function runExplorerCompareSync() {
          if (typeof window.__syncExplorerCompare === "function") window.__syncExplorerCompare();
        }

        function syncComparePanel(sourceRoot) {
          var idx = baselineBySourceRoot[sourceRoot];
          var diffEl = findDiffEl(sourceRoot);
          if (idx == null || idx === undefined) {
            clearProjectComparePanel(diffEl);
            runExplorerCompareSync();
            return;
          }
          var key = baselineKeyFromIndex(idx);
          var payload = key ? getComparisons()[key] : null;
          if (!key || !payload) {
            if (diffEl) {
              var tFil2 = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.filters;
              var msgU2 = (tFil2 && tFil2.projectCompareUnavailable) || "Compare data is not available for this baseline.";
              var tgU = findToggleEl(sourceRoot);
              if (tgU) tgU.hidden = true;
              diffEl.hidden = false;
              diffEl.innerHTML = "<div class=\\"project-compare-diff-inner project-compare-diff-inner-compact\\"><div class=\\"project-compare-diff-warning\\">" + esc(msgU2) + "</div></div>";
            }
            runExplorerCompareSync();
            return;
          }
          renderProjectComparePanel(diffEl, sourceRoot, payload);
          runExplorerCompareSync();
        }

        function escAttr(s) {
          return String(s || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;");
        }

        function formatRowLabel(s) {
          var dateStr = "—";
          if (s && s.generatedAt) {
            try { dateStr = new Date(s.generatedAt).toLocaleString(); } catch (e1) {}
          }
          var risk = (s && s.riskLevel) ? s.riskLevel : "—";
          var findings = s && s.totalFindings != null ? s.totalFindings + " findings" : "— findings";
          var score = s && s.overallScore != null ? "score " + Number(s.overallScore).toFixed(1) : "score —";
          return dateStr + " · " + risk + " · " + findings + " · " + score;
        }

        function renderPickerList() {
          if (!listEl) return;
          var hist = getHistory();
          if (hist.length === 0) {
            listEl.innerHTML = "<div class=\\"snapshot-compare-empty\\">No previous snapshots found for this workspace.</div>";
            return;
          }
          listEl.innerHTML = hist.map(function(s, i) {
            return "<button type=\\"button\\" class=\\"snapshot-compare-row\\" data-snapshot-index=\\"" + i + "\\">" + esc(formatRowLabel(s)) + "</button>";
          }).join("");
        }

        function renderBaselineStatus(el, sourceRoot) {
          if (!el) return;
          var idx = baselineBySourceRoot[sourceRoot];
          if (idx == null || idx === undefined) {
            el.hidden = true;
            el.innerHTML = "";
            clearProjectComparePanel(findDiffEl(sourceRoot));
            runExplorerCompareSync();
            syncCompareActiveCardHighlight();
            return;
          }
          var hist = getHistory();
          var s = hist[idx];
          var dateStr = "—";
          if (s && s.generatedAt) {
            try { dateStr = new Date(s.generatedAt).toLocaleString(); } catch (e2) { dateStr = "—"; }
          }
          var tCompB = window.__TRANSLATIONS__ && window.__TRANSLATIONS__.components;
          var snapTplB = (tCompB && tCompB.explorerBaselineSnapshotLabel) || "Baseline snapshot: {date}";
          var label = snapTplB.replace("{date}", dateStr);
          var lblChg = (tCompB && tCompB.explorerBaselineCardChange) || (tCompB && tCompB.explorerChangeBaseline) || "Change baseline";
          var lblClr = (tCompB && tCompB.explorerBaselineCardClear) || "Clear";
          el.hidden = false;
          el.innerHTML =
            "<span class=\\"project-compare-status-line\\">" + esc(label) + "</span>" +
            "<span class=\\"project-compare-inline-actions\\">" +
            "<button type=\\"button\\" class=\\"project-compare-change\\" data-source-root=\\"" + escAttr(sourceRoot) + "\\">" +
            esc(lblChg) +
            "</button>" +
            "<button type=\\"button\\" class=\\"project-compare-clear\\" data-source-root=\\"" + escAttr(sourceRoot) + "\\">" +
            esc(lblClr) +
            "</button>" +
            "</span>";
          syncComparePanel(sourceRoot);
          syncCompareActiveCardHighlight();
        }

        function openModal(sourceRoot) {
          closeProjectCompareDetailModal();
          pickerSourceRoot = sourceRoot || "";
          if (!modal) return;
          renderPickerList();
          modal.removeAttribute("hidden");
          modal.setAttribute("aria-hidden", "false");
        }

        function closeModal() {
          if (!modal) return;
          modal.setAttribute("hidden", "hidden");
          modal.setAttribute("aria-hidden", "true");
          pickerSourceRoot = null;
        }

        document.body.addEventListener("click", function(e) {
          var detailCloseEl = e.target && e.target.closest ? e.target.closest("[data-project-compare-detail-close]") : null;
          if (detailCloseEl) {
            e.preventDefault();
            e.stopPropagation();
            closeProjectCompareDetailModal();
            return;
          }
          var compareBtn = e.target && e.target.closest ? e.target.closest(".project-compare-btn") : null;
          if (compareBtn) {
            e.preventDefault();
            e.stopPropagation();
            var sr = compareBtn.getAttribute("data-source-root") || "";
            openModal(sr);
            return;
          }
          var toggleDetailsBtn = e.target && e.target.closest ? e.target.closest("[data-project-compare-toggle-details]") : null;
          if (toggleDetailsBtn) {
            e.preventDefault();
            e.stopPropagation();
            var srTd = toggleDetailsBtn.getAttribute("data-source-root") || "";
            openProjectCompareDetailModal(srTd);
            return;
          }
          var closeEl = e.target && e.target.closest ? e.target.closest("[data-snapshot-compare-close]") : null;
          if (closeEl) {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
            return;
          }
          var row = e.target && e.target.closest ? e.target.closest(".snapshot-compare-row") : null;
          if (row && modal && !modal.hasAttribute("hidden")) {
            e.preventDefault();
            e.stopPropagation();
            var idx = parseInt(row.getAttribute("data-snapshot-index") || "-1", 10);
            if (idx >= 0 && pickerSourceRoot != null && pickerSourceRoot !== undefined) {
              baselineBySourceRoot[pickerSourceRoot] = idx;
              window.__activeCompareContext__ = { sourceRoot: pickerSourceRoot, historyIndex: idx };
              var projInput = document.getElementById("filter-project");
              if (projInput) projInput.value = pickerSourceRoot;
              var st = findStatusEl(pickerSourceRoot);
              if (st) renderBaselineStatus(st, pickerSourceRoot);
              closeModal();
            }
            return;
          }
          var changeB = e.target && e.target.closest ? e.target.closest(".project-compare-change") : null;
          if (changeB) {
            e.preventDefault();
            e.stopPropagation();
            var srCh = changeB.getAttribute("data-source-root") || "";
            openModal(srCh);
            return;
          }
          var clearB = e.target && e.target.closest ? e.target.closest(".project-compare-clear") : null;
          if (clearB) {
            e.preventDefault();
            e.stopPropagation();
            var srCl = clearB.getAttribute("data-source-root") || "";
            delete baselineBySourceRoot[srCl];
            var ctxCl = window.__activeCompareContext__;
            if (ctxCl && ctxCl.sourceRoot === srCl) window.__activeCompareContext__ = null;
            if (typeof window.__ensureActiveCompareContext__ === "function") window.__ensureActiveCompareContext__();
            closeProjectCompareDetailModal();
            var stCl = findStatusEl(srCl);
            if (stCl) renderBaselineStatus(stCl, srCl);
            else {
              clearProjectComparePanel(findDiffEl(srCl));
              runExplorerCompareSync();
            }
            return;
          }
        });

        document.addEventListener("keydown", function(e) {
          if (e.key !== "Escape") return;
          var dmEsc = document.getElementById("project-compare-detail-modal");
          if (dmEsc && !dmEsc.hasAttribute("hidden")) {
            e.preventDefault();
            closeProjectCompareDetailModal();
            return;
          }
          if (!modal || modal.hasAttribute("hidden")) return;
          e.preventDefault();
          closeModal();
        });

        var explorerBaselineClear = document.getElementById("components-explorer-baseline-clear");
        if (explorerBaselineClear) {
          explorerBaselineClear.addEventListener("click", function(ev) {
            ev.preventDefault();
            closeProjectCompareDetailModal();
            window.__activeCompareContext__ = null;
            var baselineMapGlobal = window.__baselineBySourceRoot__ || {};
            for (var kbc in baselineMapGlobal) {
              if (Object.prototype.hasOwnProperty.call(baselineMapGlobal, kbc)) delete baselineMapGlobal[kbc];
            }
            var statusNodes = document.querySelectorAll("[data-project-compare-status]");
            for (var si = 0; si < statusNodes.length; si++) {
              var stN = statusNodes[si];
              stN.hidden = true;
              stN.innerHTML = "";
              var srN = stN.getAttribute("data-source-root");
              if (srN) clearProjectComparePanel(findDiffEl(srN));
            }
            runExplorerCompareSync();
          });
        }
        var explorerBaselineChange = document.getElementById("components-explorer-baseline-change");
        if (explorerBaselineChange) {
          explorerBaselineChange.addEventListener("click", function(ev) {
            ev.preventDefault();
            var ctx = window.__activeCompareContext__;
            var srChBar = ctx && ctx.sourceRoot ? ctx.sourceRoot : "";
            openModal(srChBar);
          });
        }
        window.__openSnapshotCompareModalForSourceRoot = function(sr) {
          openModal(sr || "");
        };
      })();
    })();`;
