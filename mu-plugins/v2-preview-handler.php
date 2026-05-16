<?php
/**
 * Plugin Name: V2 Preview Slug Handler
 * Description: Serves Elementor pages under -v2 slugs for board review (RAM-69).
 *              Prevents WordPress canonical redirect so the -v2 URL stays in the browser.
 */

add_action('parse_request', function( WP $wp ) {
    $map = [
        'links-v2'                        => 7718,
        'presets-v2'                      => 1901,
        'wsp-2026-v2'                     => 13015,
        'verso-reverso-v2'                => 13505,
        'guia-iluminacao-v2'              => 13805,
        'guia-fotografia-corporativa-v2'  => 13648,
        'curso-de-fotografia-de-celular-v2' => 8512,
        'curso-photoshop-v2'              => 8070,
    ];

    $path = trim( parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ), '/' );

    if ( ! isset( $map[ $path ] ) ) {
        return;
    }

    // Emit noindex header early (LiteSpeed doesn't reliably propagate SetEnvIf).
    header( 'X-Robots-Tag: noindex, nofollow', true );

    // Override the query to serve the target page.
    $wp->query_vars = [
        'page_id' => $map[ $path ],
        'post_type' => 'page',
    ];

    // Suppress canonical redirect — page stays at the -v2 URL.
    add_filter( 'redirect_canonical', '__return_false' );
    add_filter( 'wpseo_canonical', '__return_false' );
    add_filter( 'rank_math/frontend/canonical', '__return_false' );
    // Also tell Yoast/AIOSEO to noindex this page.
    add_filter( 'wpseo_robots', function() { return 'noindex, nofollow'; } );
    add_filter( 'wpseo_metadesc', '__return_false' );
}, 5 );
