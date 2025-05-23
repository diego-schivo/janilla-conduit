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
import { WebComponent } from "./web-component.js";

export default class LoginPage extends WebComponent {

	static get templateName() {
		return "login-page";
	}

	constructor() {
		super();
	}

	connectedCallback() {
		// console.log("LoginPage.connectedCallback");
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		// console.log("LoginPage.disconnectedCallback");
		super.disconnectedCallback();
		this.removeEventListener("submit", this.handleSubmit);
	}

	handleSubmit = async event => {
		// console.log("LoginPage.handleSubmit", event);
		event.preventDefault();
		const rl = this.closest("root-layout");
		const u = new URL(rl.dataset.apiUrl);
		u.pathname += "/users/login";
		const u2 = Object.fromEntries(new FormData(event.target));
		const r = await fetch(u, {
			method: "POST",
			headers: {
				...rl.state.apiHeaders,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ user: u2 })
		});
		const j = await r.json();
		this.state.errorMessages = !r.ok && j ? Object.entries(j).flatMap(([k, v]) => v.map(x => `${k} ${x}`)) : null;
		if (r.ok) {
			this.dispatchEvent(new CustomEvent("set-current-user", {
				bubbles: true,
				detail: { user: j.user }
			}));
			location.hash = "#/";
		} else
			this.requestDisplay();
	}

	async updateDisplay() {
		// console.log("LoginPage.updateDisplay");
		this.appendChild(this.interpolateDom({
			$template: "",
			errorMessages: this.state.errorMessages?.join(";")
		}));
	}
}
