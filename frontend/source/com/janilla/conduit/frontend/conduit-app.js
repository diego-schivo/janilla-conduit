import { UpdatableElement } from "./web-components.js";

export default class ConduitApp extends UpdatableElement {

	static get templateName() {
		return "conduit-app";
	}

	apiHeaders = {};

	constructor() {
		super();
	}

	get jwtToken() {
		return localStorage.getItem("jwtToken");
	}

	set jwtToken(x) {
		if (x)
			localStorage.setItem("jwtToken", x);
		else
			localStorage.removeItem("jwtToken");
	}

	get navItems() {
		const nii = [{
			href: "#/",
			text: "Home"
		}];
		const u = this.currentUser;
		if (u)
			nii.push({
				href: "#/editor",
				icon: "ion-compose",
				text: "New Article"
			}, {
				href: "#/settings",
				icon: "ion-gear-a",
				text: "Settings"
			}, {
				href: `#/@${u.username}`,
				image: u.image,
				text: u.username
			});
		else
			nii.push({
				href: "#/login",
				text: "Sign in"
			}, {
				href: "#/register",
				text: "Sign up"
			});
		return nii;
	}

	connectedCallback() {
		// console.log("ConduitApp.connectedCallback");
		new Promise(x => {
			const t = this.jwtToken;
			if (t) {
				const u = new URL(this.dataset.apiUrl);
				u.pathname += "/user";
				fetch(u, {
					headers: { Authorization: `Token ${t}` }
				}).then(y => y.json()).then(y => {
					this.currentUser = y?.user;
					if (this.currentUser)
						this.apiHeaders["Authorization"] = `Token ${this.currentUser.token}`;
					x();
				});
			} else
				x();
		}).then(() => {
			addEventListener("hashchange", this.handleHashChange);
			this.addEventListener("set-current-user", this.handleSetCurrentUser);
			if (location.hash)
				this.handleHashChange();
			else
				location.hash = "#/";
		})
	}

	disconnectedCallback() {
		// console.log("ConduitApp.disconnectedCallback");
		removeEventListener("hashchange", this.handleHashChange);
		this.removeEventListener("set-current-user", this.handleSetCurrentUser);
	}

	handleHashChange = event => {
		console.log("ConduitApp.handleHashChange", event);
		this.requestUpdate();
	}

	handleSetCurrentUser = event => {
		// console.log("ConduitApp.handleSetCurrentUser", event);
		this.currentUser = event.detail.user;
		this.jwtToken = this.currentUser?.token;
		this.apiHeaders["Authorization"] = this.currentUser ? `Token ${this.currentUser.token}` : "";
	}

	async update() {
		// console.log("ConduitApp.update");
		await super.update();
		this.interpolator ??= this.interpolatorBuilders[0]();
		this.header ??= this.interpolatorBuilders[1]();
		const nii = this.navItems;
		if (this.headerNavItems?.length !== nii.length)
			this.headerNavItems = nii.map(_ => this.interpolatorBuilders[2]());
		this.footer ??= this.interpolatorBuilders[3]();
		this.appendChild(this.interpolator({
			header: this.header({
				navItems: nii.map((x, i) => this.headerNavItems[i]({
					...x,
					class: `nav-link ${x.href === location.hash ? "active" : ""}`,
				}))
			}),
			path: location.hash.substring(1),
			footer: this.footer()
		}));
	}
}
