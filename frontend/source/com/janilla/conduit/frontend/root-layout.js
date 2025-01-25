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

	constructor() {
		super();
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
		const s = this.state;
		const u = new URL(a.href);
		history.pushState({
			"root-layout": {
				...s,
				version: s.version + 1
			}
		}, "", u.pathname + u.hash);
		dispatchEvent(new CustomEvent("popstate"));
	}

	handlePopState = event => {
		// console.log("RootLayout.handlePopState", event);
		const hs = history.state;
		console.log("hs", hs);
		if (hs) {
			for (const [k, v] of Object.entries(hs))
				if (k.includes("-")) {
					const el = document.querySelector(k);
					if (el && v.version !== el.state.version) {
						el.state = v;
						el.requestUpdate();
					}
				}
		} else
			this.requestUpdate();
	}

	handleSetCurrentUser = event => {
		// console.log("RootLayout.handleSetCurrentUser", event);
		this.state.currentUser = event.detail.user;
		const t = event.detail.user?.token;
		if (t) {
			localStorage.setItem("jwtToken", t);
			this.state.apiHeaders["Authorization"] = `Token ${t}`;
		} else {
			localStorage.removeItem("jwtToken");
			delete this.state.apiHeaders["Authorization"];
		}
	}

	async updateDisplay() {
		// console.log("RootLayout.updateDisplay");
		const s = this.state;
		if (s.currentUser === undefined) {
			const t = localStorage.getItem("jwtToken");
			const o = {
				version: (s.version ?? 0) + 1,
				currentUser: null,
				apiHeaders: {}
			};
			if (t) {
				const u = new URL(this.dataset.apiUrl);
				u.pathname += "/user";
				const j = await (await fetch(u, {
					headers: { Authorization: `Token ${t}` }
				})).json();
				if (j?.user) {
					o.currentUser = j.user;
					o.apiHeaders["Authorization"] = `Token ${j.user.token}`;
				}
			}
			Object.assign(s, o);
			history.replaceState({
				...history.state,
				"root-layout": o
			}, "");
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
						active: x.href === location.hash ? "active" : "",
					}));
				})()
			}),
			path: location.hash.substring(1),
			footer: { $template: "footer" }
		}));
	}
}
