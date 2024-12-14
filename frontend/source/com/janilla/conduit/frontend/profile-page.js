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
import { SlottableElement } from "./slottable-element.js";

export default class ProfilePage extends SlottableElement {

	static get observedAttributes() {
		return ["data-username", "slot"];
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
		this.removeEventListener("click", this.handleClick);
		this.removeEventListener("toggle-follow", this.handleToggleFollow);
	}

	handleClick = event => {
		// console.log("ProfilePage.handleClick", event);
		const el = event.target.closest("nav-link");
		if (!el)
			return;
		event.preventDefault();
		if (!el.classList.contains("active")) {
			this.activeTab = el.dataset.href.substring(1);
			this.requestUpdate();
		}
	}

	handleToggleFollow = event => {
		// console.log("ProfilePage.handleToggleFollow", event);
		this.state = event.detail.profile;
		this.requestUpdate();
	}

	async computeState() {
		// console.log("ProfilePage.computeState");
		if (!this.dataset.username)
			return null;
		const ca = this.closest("conduit-app");
		const u = new URL(ca.dataset.apiUrl);
		u.pathname += `/profiles/${this.dataset.username}`;
		const j = await (await fetch(u, { headers: ca.apiHeaders })).json();
		return j.profile;
	}

	render() {
		// console.log("ProfilePage.render");
		this.interpolate ??= this.createInterpolateDom();
		this.content ??= this.createInterpolateDom(1);
		this.settingsAction ??= this.createInterpolateDom(2);
		this.followAction ??= this.createInterpolateDom(3);
		const ca = this.closest("conduit-app");
		if (this.slot)
			this.activeTab ??= "author";
		else
			this.activeTab = null;
		this.appendChild(this.interpolate({
			content: this.slot && this.state ? this.content({
				...this.state,
				action: this.dataset.username === ca.currentUser?.username
					? this.settingsAction()
					: this.followAction(this.state),
				tabItems: (() => {
					const tii = this.tabItems;
					if (this.navItems?.length !== tii.length)
						this.navItems = tii.map(_ => this.createInterpolateDom(4));
					return tii.map((x, i) => this.navItems[i]({
						...x,
						class: `nav-link ${x.href.substring(1) === this.activeTab ? "active" : ""}`,
					}));
				})(),
				articlesUrl: (() => {
					const u = new URL(ca.dataset.apiUrl);
					u.pathname += "/articles";
					u.searchParams.append(this.activeTab, this.state.username);
					return u;
				})()
			}) : null
		}));
		this.querySelector("tab-nav")?.requestUpdate();
	}
}
