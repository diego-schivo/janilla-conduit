/*
 * MIT License
 *
 * Copyright (c) 2024-2025 Diego Schivo
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import WebComponent from "./web-component.js";

export default class RootLayout extends WebComponent {

	static get templateName() {
		return "root-layout";
	}

	constructor() {
		super();
	}

	get historyState() {
		return {
			"root-layout": { currentUser: this.state.currentUser }
		};
	}

	connectedCallback() {
		// console.log("RootLayout.connectedCallback");
		super.connectedCallback();
		addEventListener("popstate", this.handlePopState);
		this.addEventListener("click", this.handleClick);
		this.addEventListener("set-current-user", this.handleSetCurrentUser);
		if (!location.hash)
			location.hash = "#/";
	}

	disconnectedCallback() {
		// console.log("RootLayout.disconnectedCallback");
		super.disconnectedCallback();
		removeEventListener("popstate", this.handlePopState);
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("set-current-user", this.handleSetCurrentUser);
	}

	handleClick = event => {
		// console.log("RootLayout.handleClick", event);
		const a = event.composedPath().find(x => x.tagName?.toLowerCase() === "a");
		if (!a?.href)
			return;
		event.preventDefault();
		const u = new URL(a.href);
		history.pushState(null, "", u.pathname + u.hash);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handlePopState = event => {
		// console.log("RootLayout.handlePopState", event);
		const hs = event.state ?? history.state;
		if (hs) {
			for (const [k, v] of Object.entries(hs))
				if (k.includes("-")) {
					const el = document.querySelector(k);
					if (el) {
						el.state = v;
						el.requestDisplay();
					}
				}
		} else {
			history.replaceState(this.historyState, "");
			this.requestDisplay();
		}
	}

	handleSetCurrentUser = event => {
		// console.log("RootLayout.handleSetCurrentUser", event);
		const u = event.detail.user;
		const s = this.state;
		s.currentUser = u;
		s.apiHeaders = u?.token ? { Authorization: `Token ${u.token}` } : {};
		history.replaceState(this.historyState, "");
		if (u?.token)
			localStorage.setItem("jwtToken", u.token);
		else
			localStorage.removeItem("jwtToken");
	}

	async updateDisplay() {
		// console.log("RootLayout.updateDisplay");
		const s = this.state;
		if (s.currentUser === undefined) {
			const t = localStorage.getItem("jwtToken");
			let u;
			if (t) {
				const u2 = new URL(this.dataset.apiUrl);
				u2.pathname += "/user";
				const j = await (await fetch(u2, {
					headers: { Authorization: `Token ${t}` }
				})).json();
				u = j?.user ?? null;
			} else
				u = null;
			s.currentUser = u;
			s.apiHeaders = u?.token ? { Authorization: `Token ${u.token}` } : {};
			history.replaceState(this.historyState, "");
		}
		this.appendChild(this.interpolateDom({
			$template: "",
			header: ({
				$template: "header",
				navItems: (() => {
					const ii = [{
						href: "#/",
						text: "Home"
					}];
					const u = this.state.currentUser;
					if (u)
						ii.push({
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
						ii.push({
							href: "#/login",
							text: "Sign in"
						}, {
							href: "#/register",
							text: "Sign up"
						});
					return ii.map(x => ({
						$template: "nav-item",
						...x,
						active: x.href === location.hash ? "active" : null,
					}));
				})()
			}),
			path: location.hash.substring(1),
			footer: { $template: "footer" }
		}));
	}
}
