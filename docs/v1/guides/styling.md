## How to use custom CSS

Every widget comes with simple structural styling out-of-the-box. You can use
our CSS easily and extend it, or you can use your own CSS entirely. It's up to
you.

To use our basic CSS, all you do is include the file in your HTML. Here's an
example for the Form widget:

<link rel="stylesheet" href="https://cdn.goinstant.net/widgets/form/latest/form.css" />

If you use multiple widgets, you simply include references to multiple CSS files.

### What CSS classes does a widget have?

Each widget doc page includes a section on the CSS classes it uses as well as
its HTML structure. You can look at each widget for more details.

### How do I override the basic styles? 

If you've included our styles onto your page, then you can easily override our
stylings with your own stylesheet.

#### 1. Include your stylesheet after ours

```html
<link rel="stylesheet" href="https://cdn.gi.net/widgets/form/latest/form.css" />
<!-- Your stylesheet -->
<link rel="stylesheet" href="YOUR_STYLE.css" />
```

#### 2. Use the `gi-override` class

We nest all of our elements underneath one that has the class
`gi-override`. If you're making small modifications to our default
stylings (e.g. color, size, borders), then you'll likely want to use this.

Keeping with the Form example, let's say that you wanted to style the indicator
in the Form widget.

```css
.gi-override.gi-form .gi-indicator {
  /* Your styles here */
}
```

This is done so that you can leverage the `gi-override` class to gain
higher [specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
than our stylings without having to abuse the `!important` CSS modifier.

### Can I host my own CSS entirely? 

Yes, you can. We've created sensible defaults, but the styles
are basic, to afford you maximum flexibility. 

As you develop with our widgets you may find our default stylings more
cumbersome than helpful. If this becomes the case, there are a two options:
modify our stylesheet, or use your own.

#### Modifying our stylesheet 

As you develop with our widgets you may find our default stylings more
cumbersome than helpful.

If this becomes the case then there are a few options.

#### Modifying our stylesheet 

It may be helpful to stop including our CDN CSS file and instead just use your
own modified version stylesheet.

If you're not afraid of getting your hands dirty, feel free to copy our CSS
files and modify them directly in your project. In some cases this may be
simpler than trying to build on top of it.

#### Use your own!

If you're performing a big facelift, it may make more sense to just start fresh!
Don't include our stylesheet and just work with your own in whatever workflow
you already have!
