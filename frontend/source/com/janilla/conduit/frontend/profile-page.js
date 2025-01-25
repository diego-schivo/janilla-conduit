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

export default class ProfilePage extends UpdatableHTMLElement {

	static get observedAttributes() {
		return ["data-tab", "data-username", "slot"];
	}

	static get templateName() {
		return "profile-page";
	}

	tabItems = [{
		href: "#author",
		text: "My Articles"
	}, {
		href: "#favorited",
		text: "Favorited Articles"
	}];

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("ProfilePage.connectedCallback");
		super.connectedCallback();
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
		if (!el.classList.contains("active")) {
			history.pushState({
				...history.state,
				id: this.closest("root-layout").nextStateId(),
				tab: el.dataset.href.substring(1)
			}, "");
			dispatchEvent(new CustomEvent("popstate"));
		}
	}

	handleToggleFollow = event => {
		// console.log("ProfilePage.handleToggleFollow", event);
		const rl = this.closest("root-layout");
		rl.state.profile = event.detail.profile;
		this.requestUpdate();
	}

	async updateDisplay() {
		// console.log("ProfilePage.updateDisplay");
		const hs = history.state ?? {};
		const s = this.state;
		if (hs.profile !== s.profile)
			s.profile = hs.profile;
		const rl = this.closest("root-layout");
		if (!s.profile) {
			const u = new URL(rl.dataset.apiUrl);
			u.pathname += `/profiles/${this.dataset.username}`;
			const j = await (await fetch(u, { headers: rl.apiHeaders })).json();
			const o = { profile: j.profile };
			Object.assign(s, o);
			history.replaceState({
				...hs,
				id: rl.nextStateId(),
				...o
			}, "");
			dispatchEvent(new CustomEvent("popstate"));
			return;
		}
		this.appendChild(this.interpolateDom({
			$template: "",
			...s.profile,
			action: this.dataset.username === rl.currentUser?.username
				? { $template: "can-modify" }
				: {
					$template: "cannot-modify",
					...s.profile
				},
			tabItems: this.tabItems.map(x => ({
				$template: "tab-item",
				...x,
				class: `nav-link ${x.href.substring(1) === this.dataset.tab ? "active" : ""}`
			})),
			articlesUrl: (() => {
				const u = new URL(rl.dataset.apiUrl);
				u.pathname += "/articles";
				u.searchParams.append(this.dataset.tab, s.profile.username);
				return u;
			})()
		}));
	}
}
