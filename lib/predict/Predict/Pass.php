<?php

/** Brief satellite pass info. */
class Predict_Pass
{
    public $satname;  /* !< satellite name */
    public $aos;      /* !< AOS time in "jul_utc" */
    public $tca;      /* !< TCA time in "jul_utc" */
    public $los;      /* !< LOS time in "jul_utc" */
    public $max_el;   /* !< Maximum elevation during pass */
    public $aos_az;   /* !< Azimuth at AOS */
    public $los_az;   /* !< Azimuth at LOS */
    public $orbit;    /* !< Orbit number */
    public $maxel_az; /* !< Azimuth at maximum elevation */
    public $vis;      /* !< Visibility string, e.g. VSE, -S-, V-- */
    public $details = [];  /* !< List of pass_detail_t entries */
    public $max_apparent_magnitude = null; /* maximum apparent magnitude, experimental */

    /* Visible pass properties */
    public $visible_aos;      /* !< Visible AOS time */
    public $visible_aos_az;   /* !< Azimuth at visible AOS */
    public $visible_aos_el;   /* !< Elevation at visible AOS */
    public $visible_tca;      /* !< Visible TCA time */
    public $visible_max_el;   /* !< Maximum elevation during visible pass */
    public $visible_max_el_az; /* !< Azimuth at visible maximum elevation */
    public $visible_los;      /* !< Visible LOS time */
    public $visible_los_az;   /* !< Azimuth at visible LOS */
    public $visible_los_el;   /* !< Elevation at visible LOS */
}
