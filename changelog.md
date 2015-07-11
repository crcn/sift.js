#### 2.x

- `use()` now uses a different format:

```javascript
sift.use({
  $operator: function(a) {
    return function(b) {
      // compare here
    };
  }
})
```

- all operators are traversable now
- fix #58.
