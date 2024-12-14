import { SlottableElement } from "./web-components.js";

export default class HomePage extends SlottableElement {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateName() {
		return "home-page";
	}

	constructor() {
		super();
	}

	get tabItems() {
		const ca = this.closest("conduit-app");
		const ii = [];
		if (ca.currentUser)
			ii.push({
				href: "#feed",
				text: "Your Feed"
			});
		ii.push({
			href: "#all",
			text: "Global Feed"
		});
		if (this.activeTab === "tag")
			ii.push({
				href: "#tag",
				icon: "ion-pound",
				text: this.selectedTag
			});
		return ii;
	}

	connectedCallback() {
		// console.log("HomePage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("click", this.handleClick);
		this.addEventListener("select-tag", this.handleSelectTag);
	}

	disconnectedCallback() {
		// console.log("HomePage.disconnectedCallback");
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("select-tag", this.handleSelectTag);
	}

	handleClick = event => {
		console.log("HomePage.handleClick", event);
		const el = event.target.closest("nav-link");
		if (!el)
			return;
		event.preventDefault();
		if (!el.classList.contains("active")) {
			this.activeTab = el.dataset.href.substring(1);
			this.requestUpdate();
		}
	}

	handleSelectTag = event => {
		// console.log("HomePage.handleSelectTag", event);
		this.activeTab = "tag";
		this.selectedTag = event.detail.tag;
		this.requestUpdate();
	}

	render() {
		// console.log("HomePage.render");
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.content ??= this.interpolatorBuilders[1]();
		this.banner ??= this.interpolatorBuilders[2]();
		const ca = this.closest("conduit-app");
		if (this.slot)
			this.activeTab ??= ca.currentUser ? "feed" : "all";
		else
			this.activeTab = null;
		const c = this.content({
			banner: ca.currentUser ? null : this.banner(),
			tabItems: (() => {
				const tii = this.tabItems;
				if (this.navItems?.length !== tii.length)
					this.navItems = tii.map(_ => this.interpolatorBuilders[3]());
				return tii.map((x, i) => this.navItems[i]({
					...x,
					class: `nav-link ${x.href.substring(1) === this.activeTab ? "active" : ""}`,
				}));
			})(),
			articlesUrl: (() => {
				if (!this.activeTab)
					return null;
				const u = new URL(ca.dataset.apiUrl);
				u.pathname += "/articles";
				switch (this.activeTab) {
					case "feed":
						u.pathname += "/feed";
						break;
					case "tag":
						u.searchParams.append("tag", this.selectedTag);
						break;
				}
				return u;
			})()
		});
		this.appendChild(this.interpolator({
			content: this.slot ? c : null
		}));
	}
}
