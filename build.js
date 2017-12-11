var rollup=require('rollup');
rollup.rollup({
    entry: 'linq.js',
}).then( function ( bundle ) {
    bundle.write({
        format: 'umd',
        moduleName: 'linq',
        dest: 'dest/linq.js'
    });
});