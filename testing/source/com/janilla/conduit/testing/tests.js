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
const matchNode = (xpath, context, not) => {
	const q = resolve => {
		const n = context.ownerDocument.evaluate(xpath, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
		// console.log(xpath, e);
		if (not ? !n : n)
			resolve(n);
		return n;
	};
	let o, t;
	const r = resolve => {
		return element => {
			if (o) {
				clearTimeout(t);
				o.disconnect();
				o = null;
			}
			setTimeout(() => resolve(element), 50);
		};
	};
	return new Promise((resolve, reject) => {
		const n = q(r(resolve));
		if (not ? n : !n) {
			o = new MutationObserver(() => q(r(resolve)));
			o.observe(context, { childList: true, subtree: true });
			t = setTimeout(() => {
				if (o) {
					o.disconnect();
					o = null;
				}
				reject(`Timeout (xpath=${xpath})`);
			}, 500);
		} else if (not)
			reject(`Not found (xpath=${xpath})`);
	});
};

const untilFormControl = placeholder => async context => await matchNode(`//*[contains(@placeholder,"${placeholder}")]`, context, false);

const untilElement = (tag, text) => async context => await matchNode(`//text()[contains(.,"${text}")]/ancestor::${tag}`, context, false);

const whileElement = (tag, text) => async context => await matchNode(`//text()[contains(.,"${text}")]/ancestor::${tag}`, context, true);

const login = (email, password) => {
	return async content => {
		const b = content.body;
		(await untilElement('a', 'Sign in')(b)).click();
		(await untilFormControl('Email')(b)).value = email;
		(await untilFormControl('Password')(b)).value = password;
		(await untilElement('button', 'Sign in')(b)).click();
	};
}

const addComment = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'Global Feed')(b)).click();
	(await untilElement('a', 'Ea ullamco')(b)).click();
	(await untilFormControl('comment')(b)).value = `This is the first line.  
And this is the second line.`;
	(await untilElement('button', 'Post Comment')(b)).click();
	await untilElement('p', 'second line')(b);
}

const loginUser = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'In Laborum')(b)).click();
}

const createArticle = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'New Article')(b)).click();
	(await untilFormControl('Title')(b)).value = 'Foo bar';
	(await untilFormControl('about')(b)).value = 'Foo bar baz qux.';
	(await untilFormControl('markdown')(b)).value = `# Heading level 1

This is the first line.  
And this is the second line.
`;
	const c = await untilFormControl('tags')(b);
	for (const v of ['foo', 'bar']) {
		c.value = v;
		c.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
	}
	(await untilElement('button', 'Publish Article')(b)).click();
	await untilElement('h1', 'Foo bar')(b);
}

const deleteArticle = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'In Laborum')(b)).click();
	(await untilElement('a', 'Cupidatat ea')(b)).click();
	(await untilElement('button', 'Delete Article')(b)).click();
	await untilElement('a', 'Your Feed')(b);
}

const deleteComment = async content => {
	await login('magna.consectetur@conduit.com', 'magna')(content);
	const b = content.body;
	(await untilElement('a', 'Global Feed')(b)).click();
	(await untilElement('a', 'Incididunt id')(b)).click();
	(await untilElement('p', 'Ullamco elit')(b)).closest('.card').querySelector('.ion-trash-a').click();
	await whileElement('p', 'Ullamco elit')(b);
}

const favoriteArticle = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	const p = (await untilElement('h1', 'Incididunt id adipiscing')(b)).closest('.article-preview');
	p.querySelector('.ion-heart').click();
	await whileElement('button', '1')(p);
}

const followUser = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'Global Feed')(b)).click();
	(await untilElement('a', 'Ea ullamco')(b)).click();
	(await untilElement('button', 'Follow')(b)).click();
	(await untilElement('a', 'conduit')(b)).click();
	await untilElement('a', 'Ea ullamco')(b);
}

const logoutUser = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'In Laborum')(b)).click();
	(await untilElement('a', 'Edit Profile Settings')(b)).click();
	(await untilElement('button', 'logout')(b)).click();
	await untilElement('a', 'Sign in')(b);
}

const registerUser = async content => {
	const b = content.body;
	(await untilElement('a', 'Sign up')(b)).click();
	(await untilFormControl('Username')(b)).value = 'Foo Bar';
	(await untilFormControl('Email')(b)).value = 'foo.bar@conduit.com';
	(await untilFormControl('Password')(b)).value = 'foo';
	(await untilElement('button', 'Sign up')(b)).click();
	(await untilElement('a', 'Foo Bar')(b)).click();
}

const unfavoriteArticle = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'In Laborum')(b)).click();
	(await untilElement('a', 'Favorited Articles')(b)).click();
	(await untilElement('h1', 'Cupidatat qui eu')(b)).click();
	const e = (await untilElement('button', 'Unfavorite Article')(b));
	e.click();
	await untilElement('span', '2')(e);
}

const unfollowUser = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'Est Incididunt')(b)).click();
	(await untilElement('button', 'Unfollow')(b)).click();
	await untilElement('button', 'Follow')(b);
}

const updateArticle = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'In Laborum')(b)).click();
	(await untilElement('a', 'Cupidatat ea')(b)).click();
	(await untilElement('a', 'Edit Article')(b)).click();
	(await untilFormControl('Title')(b)).value = 'Foo bar';
	(await untilFormControl('about')(b)).value = 'Foo bar baz qux.';
	(await untilFormControl('markdown')(b)).value = `# Heading level 1

This is the first line.  
And this is the second line.
`;
	const c = await untilFormControl('tags')(b);
	for (const v of ['foo', 'bar']) {
		c.value = v;
		c.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));
	}
	(await untilElement('button', 'Publish Article')(b)).click();
	await untilElement('h1', 'Foo bar')(b);
}

const updateUser = async content => {
	await login('in.laborum@conduit.com', 'in')(content);
	const b = content.body;
	(await untilElement('a', 'Settings')(b)).click();
	(await untilFormControl('picture')(b)).value = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><text x='2' y='12.5' font-size='12'>😁</text></svg>";
	(await untilFormControl('Name')(b)).value = 'Foo Bar';
	(await untilFormControl('bio')(b)).value = `This is the first line.
And this is the second line.`;
	(await untilFormControl('Email')(b)).value = 'foo.bar@conduit.com';
	(await untilFormControl('Password')(b)).value = 'foo';
	(await untilElement('button', 'Update Settings')(b)).click();
	(await untilElement('a', 'Foo Bar')(b)).click();
}

export default {
	'Login user': loginUser,
	'Register user': registerUser,
	'Update user': updateUser,
	'Logout user': logoutUser,
	'Follow user': followUser,
	'Unfollow user': unfollowUser,
	'Create article': createArticle,
	'Update article': updateArticle,
	'Delete article': deleteArticle,
	'Add comment': addComment,
	'Delete comment': deleteComment,
	'Favorite article': favoriteArticle,
	'Unfavorite article': unfavoriteArticle
};
