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
import Article from './Article.js';
import ConduitRendering from './ConduitRendering.js';
import Editor from './Editor.js';
import Home from './Home.js';
import Layout from './Layout.js';
import Login from './Login.js';
import Profile from './Profile.js';
import Register from './Register.js';
import Settings from './Settings.js';

class Conduit {

	backendUrl;

	layout;
	
	page;

	pages = {
		'': () => new Home(),
		'article': () => new Article(),
		'editor': () => new Editor(),
		'login': () => new Login(),
		'profile': () => new Profile(),
		'register': () => new Register(),
		'settings': () => new Settings()
	};

	token = localStorage.getItem('jwtToken');

	user;

	get backendHeaders() {
		return this.user ? { 'Authorization': `Token ${this.user.token}` } : {};
	}

	run = async () => {
		if (this.token) {
			const s = await fetch(`${this.backendUrl}/api/user`, {
				headers: { 'Authorization': `Token ${this.token}` }
			});
			if (s.ok)
				this.user = (await s.json()).user;
		}
		this.listen();
		if (location.hash) await this.handleHashChange();
		else location.hash = '#/';
	}

	render = async key => {
		if (key === undefined) {
			this.layout = new Layout();
			this.layout.selector = () => document.body.firstElementChild;
			this.layout.page = this.page;
			return this.layout;
		}
	}

	listen = () => {
		addEventListener('hashchange', this.handleHashChange);
		addEventListener('userchange', this.handleUserChange);
		this.layout?.listen();
	}

	handleHashChange = async () => {
		const h = location.hash;
		this.page = this.pages[h.startsWith('#/@') ? 'profile' : h.split('/')[1]]();
		this.page.selector = () => this.layout.selector().children[1];
		document.title = this.page.title + ' \u2014 Conduit';
		const r = new ConduitRendering();
		const i = await r.renderer(this)();
		this.layout.selector().innerHTML = i;
		this.listen();
	}

	handleUserChange = async e => {
		this.user = e.detail.user;
		if (this.user)
			localStorage.setItem('jwtToken', this.user.token);
		else
			localStorage.removeItem('jwtToken');
	}
}

export default Conduit;
