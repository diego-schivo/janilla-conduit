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
import { SlottableElement } from "./slottable-element.js";

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
		if (this.state.activeTab === "tag")
			ii.push({
				href: "#tag",
				icon: "ion-pound",
				text: this.state.selectedTag
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
		// console.log("HomePage.handleClick", event);
		const el = event.target.closest("nav-link");
		if (!el)
			return;
		event.preventDefault();
		if (!el.classList.contains("active")) {
			this.state.activeTab = el.dataset.href.substring(1);
			this.requestUpdate();
		}
	}

	handleSelectTag = event => {
		// console.log("HomePage.handleSelectTag", event);
		this.state.activeTab = "tag";
		this.state.selectedTag = event.detail.tag;
		this.requestUpdate();
	}

	async computeState() {
		// console.log("LoginPage.computeState");
		const ca = this.closest("conduit-app");
		this.state = { activeTab: ca.currentUser ? "feed" : "all" };
	}

	renderState() {
		// console.log("HomePage.renderState");
		const ca = this.closest("conduit-app");
		this.appendChild(this.interpolateDom({
			$template: "",
			content: !this.state ? null : {
				$template: "content",
				banner: ca.currentUser ? null : { $template: "banner" },
				tabItems: this.tabItems.map(x => ({
					$template: "tab-item",
					...x,
					class: `nav-link ${x.href.substring(1) === this.state.activeTab ? "active" : ""}`,
				})),
				articlesUrl: (() => {
					if (!this.state.activeTab)
						return null;
					const u = new URL(ca.dataset.apiUrl);
					u.pathname += "/articles";
					switch (this.state.activeTab) {
						case "feed":
							u.pathname += "/feed";
							break;
						case "tag":
							u.searchParams.append("tag", this.state.selectedTag);
							break;
					}
					return u;
				})()
			}
		}));
	}
}
