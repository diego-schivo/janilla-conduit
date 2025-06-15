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

export default class ProfilePage extends WebComponent {

	static get observedAttributes() {
		return ["slot"];
	}

	static get templateNames() {
		return ["profile-page"];
	}

	constructor() {
		super();
	}

	get historyState() {
		const s = this.state;
		return {
			...history.state,
			"profile-page": Object.fromEntries(["profile", "tab"].map(x => [x, s[x]]))
		};
	}

	connectedCallback() {
		// console.log("ProfilePage.connectedCallback");
		super.connectedCallback();
		const s = history.state?.["profile-page"];
		if (s)
			Object.assign(this.state, s);
		this.addEventListener("click", this.handleClick);
		this.addEventListener("toggle-follow", this.handleToggleFollow);
	}

	disconnectedCallback() {
		// console.log("ProfilePage.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("toggle-follow", this.handleToggleFollow);
	}

	handleClick = event => {
		// console.log("ProfilePage.handleClick", event);
		const el = event.target.closest("nav-link");
		if (!el)
			return;
		event.preventDefault();
		event.stopPropagation();
		if (el.classList.contains("active"))
			return;
		const s = this.state;
		s.tab = el.dataset.href.substring(1);
		history.pushState(this.historyState, "");
		this.requestDisplay();
	}

	handleToggleFollow = event => {
		// console.log("ProfilePage.handleToggleFollow", event);
		this.state.profile = event.detail.profile;
		history.replaceState(this.historyState, "");
		this.requestDisplay();
	}

	async updateDisplay() {
		// console.log("ProfilePage.updateDisplay");
		const s = this.state;
		const rl = this.closest("root-layout");
		if (!s.profile || this.dataset.username != s.profile.username) {
			const u = new URL(rl.dataset.apiUrl);
			u.pathname += `/profiles/${this.dataset.username}`;
			const j = await (await fetch(u, { headers: rl.state.apiHeaders })).json();
			s.profile = j.profile;
			s.tab = "author";
			history.replaceState(this.historyState, "");
			this.closest("page-display").requestDisplay();
			return;
		}
		this.appendChild(this.interpolateDom({
			$template: "",
			...s.profile,
			action: this.dataset.username === rl.state.currentUser?.username
				? { $template: "can-modify" }
				: {
					$template: "cannot-modify",
					...s.profile
				},
			tabItems: [{
				href: "#author",
				text: "My Articles"
			}, {
				href: "#favorited",
				text: "Favorited Articles"
			}].map(x => ({
				$template: "tab-item",
				...x,
				active: x.href.substring(1) === s.tab ? "active" : null
			})),
			articlesUrl: (() => {
				const u = new URL(rl.dataset.apiUrl);
				u.pathname += "/articles";
				u.searchParams.append(s.tab, s.profile.username);
				return u;
			})()
		}));
	}
}
