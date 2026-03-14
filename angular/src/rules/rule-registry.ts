/**
 * Centralized rule metadata for Modulens.
 * Exposes the rule set for documentation, education, and transparency.
 */

export type RuleCategory =
  | "component-size"
  | "template-complexity"
  | "responsibility-god"
  | "lifecycle-cleanup"
  | "dependency-orchestration";

export type RuleSeverity = "critical" | "high" | "warning" | "info";

export type RuleImpactCategory =
  | "informational"
  | "local_maintainability"
  | "cross_cutting_maintainability"
  | "behavior_leak_risk";

export interface RuleMetadata {
  id: string;
  title: string;
  category: RuleCategory;
  severity: RuleSeverity;
  explanation: string;
  whyItMatters: string;
  badExample: string;
  goodExample: string;
  refactorDirection: string;
  /** Impact band for prioritization and display */
  impactCategory: RuleImpactCategory;
  /** 1 = highest priority, 5 = lowest */
  actionPriority: number;
  /** Short actionable sentence */
  suggestedAction: string;
  /** When this rule may produce false positives (optional) */
  commonFalsePositives?: string;
}

export const RULES_REGISTRY: RuleMetadata[] = [
  // Component Size
  {
    id: "component-size",
    title: "Component Too Large",
    category: "component-size",
    severity: "critical",
    explanation:
      "A component exceeding the allowed size (400+ lines, 800+ high, 1200+ critical) becomes difficult to maintain and usually mixes multiple concerns.",
    whyItMatters:
      "Large components often hide presentation, orchestration, and state management in one place. They are harder to test, refactor, and reason about.",
    badExample:
      "A page component with 1500+ lines, many methods, and multiple UI responsibilities.",
    goodExample:
      "A thin container component that delegates rendering to smaller presentational components.",
    refactorDirection:
      "Split into container + child components and move orchestration into services.",
    impactCategory: "cross_cutting_maintainability",
    actionPriority: 2,
    suggestedAction: "Split into smaller components and extract orchestration into services.",
  },
  {
    id: "constructor-dependencies",
    title: "Too Many Constructor Dependencies",
    category: "component-size",
    severity: "critical",
    explanation:
      "A component with 6+ constructor dependencies (or inject calls) signals tight coupling and likely mixes too many concerns.",
    whyItMatters:
      "High dependency count suggests the component orchestrates too much. It becomes brittle and hard to test in isolation.",
    badExample:
      "A component injecting 12 services: Router, HttpClient, multiple stores, form builders, and utility services.",
    goodExample:
      "A component with 2–4 focused dependencies: a single facade service, router, and perhaps a form service.",
    refactorDirection:
      "Extract orchestration into a facade or container service. Use composition over injection.",
    impactCategory: "cross_cutting_maintainability",
    actionPriority: 2,
    suggestedAction: "Extract a facade service and reduce constructor dependencies.",
  },

  // Template Complexity
  {
    id: "LARGE_TEMPLATE",
    title: "Large Template",
    category: "template-complexity",
    severity: "high",
    explanation:
      "A template exceeding 150 lines (250+ for high severity) is hard to scan and maintain. It usually contains repeated patterns.",
    whyItMatters:
      "Large templates slow change detection, obscure structure, and make it difficult to locate and fix bugs.",
    badExample:
      "A single 300-line template with many ngIf/ngFor blocks, nested forms, and inline logic.",
    goodExample:
      "A template under 80 lines that delegates to child components via selectors.",
    refactorDirection:
      "Split into smaller child components or use ng-template for reusable blocks.",
    impactCategory: "local_maintainability",
    actionPriority: 2,
    suggestedAction: "Extract repeated blocks into child components or ng-template.",
  },
  {
    id: "TEMPLATE_METHOD_CALL",
    title: "Method Call in Template",
    category: "template-complexity",
    severity: "warning",
    explanation:
      "Calling component methods directly in the template causes them to run on every change detection cycle.",
    whyItMatters:
      "Method calls in templates execute frequently and can cause performance issues. They also make templates harder to reason about.",
    badExample:
      "{{ getFullName(user) }} or (click)=\"loadData()\" where loadData does async work.",
    goodExample:
      "Use a property or pipe: {{ fullName }} or a memoized getter. Move logic to OnInit or event handlers.",
    refactorDirection:
      "Move to component property or use a pipe to avoid repeated execution on change detection.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Replace with a property or pipe; move logic to OnInit or event handlers.",
    commonFalsePositives:
      "Pure getters or event handlers (click) are often acceptable. Focus on interpolations like {{ method() }} that run every change detection.",
  },
  {
    id: "HIGH_TEMPLATE_BINDING_DENSITY",
    title: "High Template Binding Density",
    category: "template-complexity",
    severity: "info",
    explanation:
      "Too many bindings per line (interpolation, property, event) makes the template dense and harder to maintain.",
    whyItMatters:
      "High binding density increases change detection cost and obscures template structure. It makes debugging and refactoring harder.",
    badExample:
      "A single line with multiple interpolations, property bindings, and event handlers.",
    goodExample:
      "Spread bindings across lines or extract into child components with clear inputs/outputs.",
    refactorDirection:
      "Extract sub-templates or reduce bindings per line. Spread bindings across lines or move to child components.",
    impactCategory: "informational",
    actionPriority: 4,
    suggestedAction: "Spread bindings across lines or extract into child components.",
  },
  {
    id: "DEEP_STRUCTURAL_NESTING",
    title: "Deep Structural Nesting",
    category: "template-complexity",
    severity: "warning",
    explanation:
      "Structural directives (*ngIf, *ngFor) nested 4+ levels deep create complex control flow and performance overhead.",
    whyItMatters:
      "Deep nesting makes templates hard to follow and can trigger unnecessary re-renders. It obscures the actual DOM structure.",
    badExample:
      "*ngFor > *ngIf > *ngFor > *ngIf with multiple nested blocks.",
    goodExample:
      "Flatten with ng-container or extract nested blocks into child components.",
    refactorDirection:
      "Flatten structure with ng-container or extract nested blocks into child components.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Flatten with ng-container or extract nested blocks into child components.",
  },
  {
    id: "NGFOR_WITHOUT_TRACKBY",
    title: "ngFor Without trackBy",
    category: "template-complexity",
    severity: "warning",
    explanation:
      "Using *ngFor without a trackBy function causes Angular to re-create DOM nodes when the list changes.",
    whyItMatters:
      "Without trackBy, list updates can cause unnecessary DOM churn and poor performance, especially with large lists.",
    badExample:
      "*ngFor=\"let item of items\" without trackBy.",
    goodExample:
      "*ngFor=\"let item of items; trackBy: trackById\" with a stable identifier.",
    refactorDirection:
      "Add trackBy function for list performance and stable DOM identity.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Add trackBy with a stable identifier for list performance.",
    commonFalsePositives: "Small static lists may not benefit much from trackBy.",
  },
  {
    id: "LONG_INLINE_TEMPLATE_EXPRESSION",
    title: "Long Inline Template Expression",
    category: "template-complexity",
    severity: "info",
    explanation:
      "Complex expressions inline in the template (e.g. chained method calls, ternary chains) hurt readability and performance.",
    whyItMatters:
      "Long expressions run on every change detection cycle and make templates harder to understand and test.",
    badExample:
      "{{ user?.address?.city ?? 'Unknown' }} with nested ternaries or method chains.",
    goodExample:
      "Extract to a component property or a pipe. Keep templates declarative.",
    refactorDirection:
      "Extract complex expressions to component properties or pipes for readability.",
    impactCategory: "informational",
    actionPriority: 4,
    suggestedAction: "Extract to component property or pipe for readability.",
  },
  {
    id: "EVENT_BINDING_HEAVY_TEMPLATE",
    title: "Heavy Event Binding",
    category: "template-complexity",
    severity: "warning",
    explanation:
      "A template with 8+ event bindings suggests too many handlers in one place.",
    whyItMatters:
      "Many event bindings increase template complexity and suggest the component handles too many concerns. This hurts testability and reuse.",
    badExample:
      "A template with 15+ (click), (change), (input) handlers on various elements.",
    goodExample:
      "Use event delegation or consolidate handlers. Extract sub-components with focused event handling.",
    refactorDirection:
      "Use event delegation or consolidate handlers. Extract sub-components with focused event handling.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Extract sub-components or use event delegation.",
  },

  // Responsibility / God Component
  {
    id: "GOD_COMPONENT_SMELL",
    title: "God Component Smell",
    category: "responsibility-god",
    severity: "high",
    explanation:
      "A component with high responsibility density: many methods, properties, inputs, and outputs (e.g. 15+ methods, 12+ properties).",
    whyItMatters:
      "God components orchestrate too many concerns. They are hard to test, refactor, and reason about. Changes ripple unpredictably.",
    badExample:
      "A component with 25 methods, 18 properties, 10 inputs, and 5 outputs.",
    goodExample:
      "A focused component with 5–8 methods and clear inputs/outputs. Logic delegated to services.",
    refactorDirection:
      "Split into smaller focused components. Extract presentation, orchestration, or form logic into dedicated child components or services.",
    impactCategory: "cross_cutting_maintainability",
    actionPriority: 2,
    suggestedAction: "Split into focused components; delegate logic to services.",
  },
  {
    id: "EXCESSIVE_LOCAL_STATE",
    title: "Excessive Local State",
    category: "responsibility-god",
    severity: "warning",
    explanation:
      "Too many UI state-like fields (selected, isLoading, open, etc.) in one component.",
    whyItMatters:
      "Scattered UI state is hard to reason about and can lead to inconsistent UI behavior. State transitions become unclear.",
    badExample:
      "A component with 8+ boolean flags: isOpen, isExpanded, isLoading, hasError, isSelected, etc.",
    goodExample:
      "Consolidate into a single state object or move to a dedicated state service. Consider signals for reactive state.",
    refactorDirection:
      "Consolidate UI state into a single state object or move to a dedicated state service. Consider signals for reactive state.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Consolidate into a state object or dedicated state service.",
  },
  {
    id: "TOO_MANY_PUBLIC_HANDLERS",
    title: "Too Many Public Handlers",
    category: "responsibility-god",
    severity: "warning",
    explanation:
      "A component with 8+ public methods exposed to the template or external callers.",
    whyItMatters:
      "Many public handlers suggest the component does too much. It becomes a magnet for more handlers and harder to maintain.",
    badExample:
      "A component with 15 public methods: onSave, onCancel, onEdit, onDelete, onExpand, etc.",
    goodExample:
      "Delegate to services, extract event handlers into child components, or group related handlers.",
    refactorDirection:
      "Delegate to services, extract event handlers into child components, or group related handlers.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Delegate to services or extract handlers into child components.",
  },
  {
    id: "UI_STATE_HEAVY_COMPONENT",
    title: "UI State Heavy Component",
    category: "responsibility-god",
    severity: "info",
    explanation:
      "Many UI state fields combined with high method count. The component manages too much UI state locally.",
    whyItMatters:
      "Heavy UI state in one component makes state transitions hard to trace and can cause subtle bugs.",
    badExample:
      "A component with 5+ UI state fields and 12+ methods that manipulate them.",
    goodExample:
      "Extract UI state management. Consider a dedicated state slice or ViewModel pattern.",
    refactorDirection:
      "Extract UI state management. Consider a dedicated state slice or ViewModel pattern.",
    impactCategory: "informational",
    actionPriority: 4,
    suggestedAction: "Extract UI state into a dedicated state slice or ViewModel.",
  },

  // Lifecycle / Cleanup
  {
    id: "SUBSCRIPTION_WITHOUT_DESTROY",
    title: "Subscription Without Cleanup",
    category: "lifecycle-cleanup",
    severity: "critical",
    explanation:
      "Subscriptions (subscribe) that are not unsubscribed in ngOnDestroy or via takeUntilDestroyed can cause memory leaks.",
    whyItMatters:
      "Unmanaged subscriptions keep components in memory after they are destroyed. Long-lived streams (intervals, fromEvent) are especially risky.",
    badExample:
      "this.service.getData().subscribe(...) with no ngOnDestroy or takeUntilDestroyed.",
    goodExample:
      "Use takeUntilDestroyed() or store subscriptions and unsubscribe in ngOnDestroy.",
    refactorDirection:
      "Add ngOnDestroy cleanup or use takeUntil/takeUntilDestroyed for event/timer streams.",
    impactCategory: "behavior_leak_risk",
    actionPriority: 1,
    suggestedAction: "Add takeUntilDestroyed() or unsubscribe in ngOnDestroy.",
    commonFalsePositives:
      "HTTP requests that complete before component destroy typically do not leak. Focus on long-lived streams (intervals, fromEvent, route params).",
  },
  {
    id: "EMPTY_NG_ON_DESTROY",
    title: "Empty ngOnDestroy",
    category: "lifecycle-cleanup",
    severity: "warning",
    explanation:
      "ngOnDestroy is present but empty while the component uses subscriptions, intervals, timeouts, or listeners.",
    whyItMatters:
      "Resources created in the component are not released. This causes memory leaks and unexpected behavior when the component is destroyed.",
    badExample:
      "ngOnDestroy() {} with subscribe(), setInterval(), or addEventListener in the component.",
    goodExample:
      "ngOnDestroy() { this.sub?.unsubscribe(); clearInterval(this.intervalId); }",
    refactorDirection:
      "Add cleanup logic or prove resources are auto-completing and externally managed.",
    impactCategory: "behavior_leak_risk",
    actionPriority: 1,
    suggestedAction: "Add cleanup logic in ngOnDestroy for subscriptions, intervals, and listeners.",
  },
  {
    id: "INTERVAL_WITHOUT_CLEANUP",
    title: "Interval Without Cleanup",
    category: "lifecycle-cleanup",
    severity: "high",
    explanation:
      "setInterval is used but the return value is not stored and cleared in ngOnDestroy.",
    whyItMatters:
      "Intervals continue running after the component is destroyed, causing memory leaks and unexpected callbacks.",
    badExample:
      "setInterval(() => this.poll(), 5000) with no clearInterval in ngOnDestroy.",
    goodExample:
      "this.intervalId = setInterval(...); ngOnDestroy() { clearInterval(this.intervalId); }",
    refactorDirection:
      "Store setInterval return value and call clearInterval in ngOnDestroy.",
    impactCategory: "behavior_leak_risk",
    actionPriority: 1,
    suggestedAction: "Store interval ID and call clearInterval in ngOnDestroy.",
  },
  {
    id: "LISTENER_WITHOUT_CLEANUP",
    title: "Listener Without Cleanup",
    category: "lifecycle-cleanup",
    severity: "high",
    explanation:
      "addEventListener is used but removeEventListener is not called in ngOnDestroy.",
    whyItMatters:
      "Listeners keep references to the component and prevent garbage collection. They can also fire after the component is gone.",
    badExample:
      "element.addEventListener('click', this.handler) with no removeEventListener.",
    goodExample:
      "element.addEventListener(...); ngOnDestroy() { element.removeEventListener(...); }",
    refactorDirection:
      "Call removeEventListener with the same target, event, and handler in ngOnDestroy.",
    impactCategory: "behavior_leak_risk",
    actionPriority: 1,
    suggestedAction: "Call removeEventListener in ngOnDestroy with same target, event, and handler.",
  },
  {
    id: "RENDERER_LISTEN_WITHOUT_DISPOSE",
    title: "Renderer2.listen Without Dispose",
    category: "lifecycle-cleanup",
    severity: "high",
    explanation:
      "Renderer2.listen() returns a cleanup function that must be invoked. It is not being disposed.",
    whyItMatters:
      "Renderer2.listen listeners persist after component destruction. They can cause memory leaks and errors.",
    badExample:
      "this.renderer.listen(element, 'click', handler) without storing and invoking the returned function.",
    goodExample:
      "this.listenFn = this.renderer.listen(...); ngOnDestroy() { this.listenFn?.(); }",
    refactorDirection:
      "Store the returned cleanup function and invoke it in ngOnDestroy.",
    impactCategory: "behavior_leak_risk",
    actionPriority: 1,
    suggestedAction: "Store the returned cleanup function and invoke it in ngOnDestroy.",
  },
  {
    id: "TIMEOUT_REQUIRES_REVIEW",
    title: "Timeout Requires Review",
    category: "lifecycle-cleanup",
    severity: "warning",
    explanation:
      "setTimeout is used but the return value may not be stored and cleared in ngOnDestroy.",
    whyItMatters:
      "Timeouts can fire after the component is destroyed. Recursive timeouts are especially risky.",
    badExample:
      "setTimeout(() => this.doSomething(), 1000) with no clearTimeout in ngOnDestroy.",
    goodExample:
      "this.timeoutId = setTimeout(...); ngOnDestroy() { clearTimeout(this.timeoutId); }",
    refactorDirection:
      "Store setTimeout return value and call clearTimeout in ngOnDestroy; verify recursive timeout chains.",
    impactCategory: "behavior_leak_risk",
    actionPriority: 2,
    suggestedAction: "Store timeout ID and call clearTimeout in ngOnDestroy.",
  },
  {
    id: "CLEANUP_OWNERSHIP_UNCLEAR",
    title: "Cleanup Ownership Unclear",
    category: "lifecycle-cleanup",
    severity: "warning",
    explanation:
      "Timer or listener usage detected but ownership (stored IDs, pairing) is unclear. Cleanup may be missing.",
    whyItMatters:
      "Without clear ownership, it is hard to verify that all resources are released. Leaks can go unnoticed.",
    badExample:
      "setTimeout or addEventListener without storing IDs or handler references for cleanup.",
    goodExample:
      "Store timer IDs and listener references. Ensure they are released on teardown.",
    refactorDirection:
      "Ensure timer IDs and listener references are stored and released on teardown.",
    impactCategory: "behavior_leak_risk",
    actionPriority: 2,
    suggestedAction: "Store timer IDs and listener references; release on teardown.",
  },
  {
    id: "NG_ON_CHANGES_WITHOUT_INPUT",
    title: "ngOnChanges Without Input",
    category: "lifecycle-cleanup",
    severity: "info",
    explanation:
      "ngOnChanges is implemented but no local @Input or input() usage was detected.",
    whyItMatters:
      "The hook may be unnecessary or inputs are inherited. Unused hooks add noise and maintenance cost.",
    badExample:
      "ngOnChanges(changes: SimpleChanges) {} with no @Input() properties.",
    goodExample:
      "Remove ngOnChanges if inputs are inherited from a base class, or add the relevant inputs.",
    refactorDirection:
      "Confirm inputs are not inherited from a base class, then remove ngOnChanges if unnecessary.",
    impactCategory: "informational",
    actionPriority: 5,
    suggestedAction: "Remove ngOnChanges if inputs are inherited, or add relevant inputs.",
    commonFalsePositives: "Inputs may be inherited from a base class or use input() signal API.",
  },
  {
    id: "RISKY_HOOK_USAGE",
    title: "Risky Hook Usage",
    category: "lifecycle-cleanup",
    severity: "warning",
    explanation:
      "ngAfterViewChecked or ngAfterContentChecked detected. These hooks run frequently and can hurt performance.",
    whyItMatters:
      "Checked hooks run on every change detection cycle. Heavy logic here can cause severe performance issues.",
    badExample:
      "ngAfterViewChecked() { this.computeLayout(); } with expensive logic.",
    goodExample:
      "Keep checked hooks only when necessary. Validate change-detection cost. Prefer OnPush.",
    refactorDirection:
      "Keep checked hooks only when necessary and validate change-detection cost.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Validate change-detection cost; prefer OnPush when possible.",
  },
  {
    id: "DOCHECK_USAGE",
    title: "ngDoCheck Usage",
    category: "lifecycle-cleanup",
    severity: "warning",
    explanation:
      "ngDoCheck is used. This hook runs on every change detection and requires careful implementation.",
    whyItMatters:
      "ngDoCheck is easy to misuse and can cause performance problems. It runs very frequently.",
    badExample:
      "ngDoCheck() { /* heavy logic or broad checks */ }",
    goodExample:
      "Verify this hook is required. Use a narrow, efficient custom check. Consider KeyValueDiffers or IterableDiffers.",
    refactorDirection:
      "Verify this hook is required and uses a narrow, efficient custom check.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Use narrow, efficient custom check with KeyValueDiffers or IterableDiffers.",
  },
  {
    id: "TOO_MANY_LIFECYCLE_HOOKS",
    title: "Too Many Lifecycle Hooks",
    category: "lifecycle-cleanup",
    severity: "warning",
    explanation:
      "The component uses 6+ lifecycle hooks with additional risk signals (subscriptions, timers, etc.).",
    whyItMatters:
      "Many hooks suggest the component does too much during its lifecycle. Initialization and cleanup become hard to follow.",
    badExample:
      "A component with ngOnInit, ngAfterViewInit, ngDoCheck, ngOnChanges, ngOnDestroy, and more.",
    goodExample:
      "Split responsibilities or move heavy lifecycle behavior into dedicated services.",
    refactorDirection:
      "Split responsibilities or move heavy lifecycle behavior into dedicated services.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Split responsibilities or move lifecycle behavior into services.",
  },
  {
    id: "HEAVY_AFTER_VIEW_INIT",
    title: "Heavy ngAfterViewInit",
    category: "lifecycle-cleanup",
    severity: "warning",
    explanation:
      "ngAfterViewInit contains 12+ top-level statements. Heavy setup in this hook can block rendering.",
    whyItMatters:
      "Heavy logic in ngAfterViewInit delays first paint and makes the component harder to test and maintain.",
    badExample:
      "ngAfterViewInit() with 20+ lines of DOM manipulation, subscriptions, and setup.",
    goodExample:
      "Move heavy setup to helper methods or services. Keep hook logic focused.",
    refactorDirection:
      "Consider moving heavy setup to helper methods/services and keep hook logic focused.",
    impactCategory: "local_maintainability",
    actionPriority: 3,
    suggestedAction: "Move heavy setup to helper methods or services.",
  },

  // Dependency / Orchestration
  {
    id: "HEAVY_FORM_ORCHESTRATION",
    title: "Heavy Form Orchestration",
    category: "dependency-orchestration",
    severity: "high",
    explanation:
      "The component has heavy form orchestration: multiple FormGroups and many patch/set/update calls.",
    whyItMatters:
      "Form logic mixed with presentation makes components hard to test and reuse. Form state becomes tangled with UI.",
    badExample:
      "A component with 3 FormGroups and 15+ formControlName/patchValue calls in the template and class.",
    goodExample:
      "Extract form logic into a dedicated form service or child component. Use reactive forms with FormBuilder in a separate layer.",
    refactorDirection:
      "Extract form logic into a dedicated form service or child component. Consider reactive forms with FormBuilder in a separate layer.",
    impactCategory: "cross_cutting_maintainability",
    actionPriority: 2,
    suggestedAction: "Extract form logic into a dedicated form service or child component.",
  },
  {
    id: "MIXED_PRESENTATION_AND_ORCHESTRATION",
    title: "Mixed Presentation and Orchestration",
    category: "dependency-orchestration",
    severity: "warning",
    explanation:
      "The component mixes presentation with orchestration: form, router, dialog/modal, and service orchestration.",
    whyItMatters:
      "Mixing concerns makes the component hard to test and reuse. Presentation and business logic become coupled.",
    badExample:
      "A component that handles routing, form validation, dialog opening, and HTTP calls in one place.",
    goodExample:
      "Split into a thin container component (orchestration) and presentation components. Use smart/dumb component pattern.",
    refactorDirection:
      "Split into a thin container component (orchestration) and presentation components. Use smart/dumb component pattern.",
    impactCategory: "cross_cutting_maintainability",
    actionPriority: 3,
    suggestedAction: "Split into thin container and presentation components.",
  },
  {
    id: "NAVIGATION_AND_DATA_LOADING_COUPLED",
    title: "Navigation and Data Loading Coupled",
    category: "dependency-orchestration",
    severity: "info",
    explanation:
      "Router usage combined with subscription/data loading. Navigation and data fetching may be tightly coupled.",
    whyItMatters:
      "Tight coupling makes it hard to reuse data loading logic and can cause race conditions or duplicate requests.",
    badExample:
      "Subscribing to route params in ngOnInit and fetching data in the same component.",
    goodExample:
      "Resolve data in route guards or a dedicated resolver. Decouple navigation from data loading.",
    refactorDirection:
      "Consider resolving data in route guards or a dedicated resolver. Decouple navigation from data loading.",
    impactCategory: "informational",
    actionPriority: 4,
    suggestedAction: "Resolve data in route guards or a dedicated resolver.",
  },
];

const CATEGORY_ORDER: RuleCategory[] = [
  "component-size",
  "template-complexity",
  "responsibility-god",
  "lifecycle-cleanup",
  "dependency-orchestration",
];

export function getRulesByCategory(): Map<RuleCategory, RuleMetadata[]> {
  const map = new Map<RuleCategory, RuleMetadata[]>();
  for (const cat of CATEGORY_ORDER) {
    map.set(cat, []);
  }
  for (const rule of RULES_REGISTRY) {
    const list = map.get(rule.category) ?? [];
    list.push(rule);
    map.set(rule.category, list);
  }
  return map;
}

export function getRuleById(id: string): RuleMetadata | undefined {
  return RULES_REGISTRY.find((r) => r.id === id);
}
