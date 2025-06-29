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

export default class Login extends WebComponent {

	static get templateNames() {
		return ["login"];
	}

	constructor() {
		super();
	}

	connectedCallback() {
		super.connectedCallback();
		this.addEventListener("submit", this.handleSubmit);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.removeEventListener("submit", this.handleSubmit);
	}

	async updateDisplay() {
		this.appendChild(this.interpolateDom({
			$template: "",
			errorMessages: this.state.errorMessages?.join(";")
		}));
	}

	handleSubmit = async event => {
		event.preventDefault();
		const { dataset: { apiUrl }, state: { apiHeaders }} = this.closest("app-element");
		const r = await fetch(new URL(`${apiUrl}/users/login`), {
			method: "POST",
			headers: {
				...apiHeaders,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ user: Object.fromEntries(new FormData(event.target)) })
		});
		if (r.ok) {
			const { user } = await r.json();
			this.dispatchEvent(new CustomEvent("set-current-user", {
				bubbles: true,
				detail: { user }
			}));
		} else {
			const o = await r.json();
			this.state.errorMessages = Object.entries(o).flatMap(([k, v]) => v.map(x => `${k} ${x}`));
			this.requestDisplay();
		}
	}
}
