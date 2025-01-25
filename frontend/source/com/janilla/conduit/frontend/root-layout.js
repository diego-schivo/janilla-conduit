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
import { UpdatableHTMLElement } from "./updatable-html-element.js";

export default class RootLayout extends UpdatableHTMLElement {

	static get templateName() {
		return "root-layout";
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
		// console.log("RootLayout.connectedCallback");
		super.connectedCallback();
		new Promise(x => {
			const jt = this.jwtToken;
			if (jt) {
				const u = new URL(this.dataset.apiUrl);
				u.pathname += "/user";
				fetch(u, {
					headers: { Authorization: `Token ${jt}` }
				}).then(y => y.json()).then(y => {
					this.currentUser = y?.user;
					if (this.currentUser)
						this.apiHeaders["Authorization"] = `Token ${this.currentUser.token}`;
					x();
				});
			} else
				x();
		}).then(() => {
			// addEventListener("hashchange", this.handleHashChange);
			addEventListener("popstate", this.handlePopState);
			this.addEventListener("click", this.handleClick);
			this.addEventListener("set-current-user", this.handleSetCurrentUser);
			if (location.hash)
				this.handleHashChange();
			else
				location.hash = "#/";
		})
	}

	disconnectedCallback() {
		// console.log("RootLayout.disconnectedCallback");
		super.disconnectedCallback();
		// removeEventListener("hashchange", this.handleHashChange);
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
		history.pushState({ id: this.nextStateId() }, "", u.hash);
		dispatchEvent(new CustomEvent("popstate"));
	}

	/*
	handleHashChange = event => {
		console.log("RootLayout.handleHashChange", event);
		this.requestUpdate();
	}
	*/

	handlePopState = event => {
		console.log("RootLayout.handlePopState", event);
		this.requestUpdate();
	}

	handleSetCurrentUser = event => {
		// console.log("RootLayout.handleSetCurrentUser", event);
		this.currentUser = event.detail.user;
		this.jwtToken = this.currentUser?.token;
		this.apiHeaders["Authorization"] = this.currentUser ? `Token ${this.currentUser.token}` : "";
	}

	async updateDisplay() {
		// console.log("RootLayout.updateDisplay");
		this.appendChild(this.interpolateDom({
			$template: "",
			header: ({
				$template: "header",
				navItems: this.navItems.map(x => ({
					$template: "nav-item",
					...x,
					class: `nav-link ${x.href === location.hash ? "active" : ""}`,
				}))
			}),
			path: location.hash.substring(1),
			stateId: history.state?.id,
			footer: { $template: "footer" }
		}));
	}

	nextStateId() {
		return ++stateId;
	}
}

let stateId = 0;
