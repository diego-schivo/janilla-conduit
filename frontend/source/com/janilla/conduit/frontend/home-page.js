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

export default class HomePage extends UpdatableHTMLElement {

	static get templateName() {
		return "home-page";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("HomePage.connectedCallback");
		super.connectedCallback();
		const s = history.state?.["home-page"];
		if (s)
			Object.assign(this.state, s);
		this.addEventListener("click", this.handleClick);
		this.addEventListener("select-tag", this.handleSelectTag);
	}

	disconnectedCallback() {
		// console.log("HomePage.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("select-tag", this.handleSelectTag);
	}

	handleClick = event => {
		// console.log("HomePage.handleClick", event);
		const el = event.target.closest("nav-link");
		if (!el)
			return;
		event.preventDefault();
		event.stopPropagation();
		if (!el.classList.contains("active")) {
			history.pushState({
				...history.state,
				"home-page": {
					version: this.state.version + 1,
					tab: el.dataset.href.substring(1)
				}
			}, "");
			dispatchEvent(new CustomEvent("popstate"));
		}
	}

	handleSelectTag = event => {
		// console.log("HomePage.handleSelectTag", event);
		history.pushState({
			...history.state,
			"home-page": {
				version: this.state.version + 1,
				tab: "tag",
				tag: event.detail.tag
			}
		}, "");
		dispatchEvent(new CustomEvent("popstate"));
	}

	async updateDisplay() {
		// console.log("HomePage.updateDisplay");
		const s = this.state;
		const rl = this.closest("root-layout");
		if (!s.tab) {
			const o = {
				version: (s.version ?? 0) + 1,
				tab: rl.currentUser ? "feed" : "all"
			};
			Object.assign(s, o);
			history.replaceState({
				...history.state,
				"home-page": o
			}, "");
		}
		this.appendChild(this.interpolateDom({
			$template: "",
			banner: rl.currentUser ? null : { $template: "banner" },
			tabItems: (() => {
				const ii = [];
				if (rl.currentUser)
					ii.push({
						href: "#feed",
						text: "Your Feed"
					});
				ii.push({
					href: "#all",
					text: "Global Feed"
				});
				if (s.tab === "tag")
					ii.push({
						href: "#tag",
						icon: "ion-pound",
						text: s.tag
					});
				return ii.map(x => ({
					$template: "tab-item",
					...x,
					active: x.href.substring(1) === s.tab ? "active" : "",
				}));
			})(),
			articlesUrl: (() => {
				const u = new URL(rl.dataset.apiUrl);
				u.pathname += "/articles";
				switch (s.tab) {
					case "feed":
						u.pathname += "/feed";
						break;
					case "tag":
						u.searchParams.append("tag", s.tag);
						break;
				}
				return u;
			})()
		}));
	}
}
