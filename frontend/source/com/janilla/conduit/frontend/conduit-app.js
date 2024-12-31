/*
 * MIT License
 *
 * Copyright (c) 2024 Diego Schivo
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
import { FlexibleElement } from "./flexible-element.js";

export default class ConduitApp extends FlexibleElement {

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
		// console.log("ConduitApp.handleHashChange", event);
		const cc = this.querySelector("page-display")?.children;
		if (cc)
			Array.prototype.forEach.call(cc, x => x.removeAttribute("slot"));
		this.requestUpdate();
	}

	handleSetCurrentUser = event => {
		// console.log("ConduitApp.handleSetCurrentUser", event);
		this.currentUser = event.detail.user;
		this.jwtToken = this.currentUser?.token;
		this.apiHeaders["Authorization"] = this.currentUser ? `Token ${this.currentUser.token}` : "";
	}

	async updateDisplay() {
		// console.log("ConduitApp.updateDisplay");
		if (!this.isConnected)
			return;
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
			footer: { $template: "footer" }
		}));
	}
}
