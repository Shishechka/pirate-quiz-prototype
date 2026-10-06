'use strict';
(function(){
  const css=document.createElement('style');
  css.textContent=`
    html,body,#app,.mapViewport{background:#2b190e!important}
    .mapScene{
      width:1600px!important;height:780px!important;
      background-image:url("data:image/webp;base64,UklGRpRKAABXRUJQVlA4IIhKAACwYgGdASpYAlIBPwFysFGrJqS2q/cK2tAgCWNsPvNv6YSCP3NUJnQfsTyEVPTAkmME57ITafwNrJns3M48y9pTbBvXJZ6oVu/WXXw1Cc+Pt/DNwh+pnZt9Cc9++Jz5d2K9sbamwh/Fd2j+bf/PWT2q+v/1EfPXpbRfOl9B3dRT4Ppr/Nrw5uHUM94emgNn8i7goR4bNlmiH5GGUkGI3r7bFG+vRDmVPbsnBF8RmsSVgNSmMtPxk2RId40k7/NGWJRmOfqil6QQy1MZsAjT74siignDRs/lLZVjbj+7FaQgbRjf5b58B0nvwpBbLEaQecp+oyV946oDvagU4FnbWi+k0xLvDFLz/P7rXQngKEB3fsBv4T/YItPVEuQe+774qVZQDGr4Yx16k0/q+gvZ4xcij0wkzU8BSYWJuBFk0PrD7ecPOV8KyX56MLo3fzHLzrcWI1u7N4fHO1l7VN2kWcxpK4BWKDNHiW3HngdnpYfnOUVlV69ZJD+LCPDW3YQvyiVrLU9vejOX7nA1+Mg4ff2B3Hs3I0KtoexWL6D25qQiGPrtgT1kUjJA5DQ0QkE/yuANOvDPvs65ZGrJD0e7imXSMr/0Pt6pAFbCyet1ysvqqBr/XV8XHuGGH10UXJdkd6bnwAGV74pYuXbtfiGqxBzcKSfluPPK4458YeezAY19QxawQk0lfUXh8loPVX5uaOg1O97nx0OuEWBMaFYG4eAv3dMPTs3OjqDoAbe6uChQBQCYiMkFrH9eLk5fcYWr+3KKnGMdtwIjhU0C6t+1sE3lzeTaYfMp11D/5jb6q5m5WCl7LyQ2tAfT591SHTOMz+gDvNs1E6DLI3tXWysApxSPfc7mhm+T+OfjCPVxLTF2kG1rnnnMyeVSEbbyZc3VlTtlYOx1ADbHUKPZI3tSBQlcOv00awtBOpczb+SEaWEVauXx2Iw0TNtH5BN/hh3r4ZIgb69KDgIgm+2mWKhmwgs6rZAWjQco9MAh4WExemB9Uowq3TUmLeVCXVT1t21UWwyO0UpNShpDNeFtQiyc1VW/5D0p4kRlzp9RgE4EPj05YlprG1GU1zJZMTFdw8mN80SUfSCBpP5LgKUCsPzKlecUSBfJkhkyIXyeuvcz7OBHwwn3X8SnhqX/txfhhwzw5t7HZWFJ+fey5ASllCBzkPfOXA8950FCDyEPzYlPp0zRY/OFsLnBJ6YhOpXno5jFOh5ioYCIXHMEoBTKr2UVfL7xn5pOS4JZRX3U8hiWa8E+PPBJA9IEfwoQK4ELRQq6+HFOJmgQPp/hTAxQvjOVnTMg55T5mTe8RM+nNKBOc4yNtpWl4ke+ZujR0glCekI3ed1FaWZKIHme8Y/NoBd19mHk3FHvmk21uuyX3v5pr/x3knZqmBNprwWYdf+omFJQhb+n+6C709QbOCCurAC4ztYMPMUtxYsGHaNQ0IQ7Bz8baHOQnInXeguUVU3N+/toAC1I0OS3yvDKxoYnNb7RpK7vTm2iijkMp6mEn9CLrcS6dggDqZ+NuB8AS/wFNXrBapJoKuEyBgYwUhpiI1p94HehsK2HaNK/cdapLNyNQMa7u+JcTv8U7uyQ3ReN7RmQ1PUSUmpVJEdfRLYfjTW4BM+LNvceeIN0ThQ90saz+a93C7l6Prbkw8NtGQsWutGW4LNmw6ej2k6n8dlOPxHCqI/KuX3HcX1nNbVWYAA8i4nO2sY0UiyyCLvnrx1z4RtkYfoxDFjN2qq5AixH35IIHSd/C+LBIbjggqev4flDLuyG9bqytguhEnCywyQf7YsHdrc6KcGI4HHU77WKRd3KYiH9IMpDEIWn4uN/AlgmDM4E1lB/Qfal+YMe+xJCaPcORV6JUormFX8WDtwN4JiREgyto6BMISeXxK9RZxguz4gXQvrT15JyWT7ox81rADcHkm2UidupupqzDkv8PRDCAnJnpZxmx+Gm79FVnktE09gUb9Zs+FmGMzDaXVbZnJ5aKBfr+PtM7N6IjylW+N8QwXcEcfm8M5et9k5uMdqvvWsFuQn6zUGs5hAcZAnxxDX4I4NSgwm0pyFCjXOxR6DKNreOxGPLbli+Xg9H2qEgQkkAXLSJewnMPT+DL6MjnvotEZP1KoJ+zKk9ew7ren0SOa5hszbWmULvnQHPfAnDS4AK93+gGYJWs2OoYMb0PwCUtXddbnxhQC4MgMlgzwmOoTqHCwSRQDnLhJCnZPKRf4DMDLY0tj2mX8zpsFkK+qdWUxcHtCsruPRK1l9DhDaChXvhnzpnT6RvwKhaFA4KCqa7ZDSHB2do66AjyHSuwzShdqhb9cY0LPnRTTMAnX+f1D71LKuxCJcp1UuBL7SJmMYcUDyj6EluXs2NsekIoDq7hZcA/YTOg72Qzq6hVCzKd8WYpJ2k8WbhehwnSDJS2bV/Zx2OIqIxMZnAEPf9NE05P+RvktnTHJx9alr+Qh2tCrNQpWVyGwaPkpmv7xEjRE0GASLUaAFRe55hIXXfv25mYwfLqu7algg/b8IGhkCIrs0ApDNJYRp07sEzpLWSdMMHlrnYAcxBCLGDcNxk1sR7YRvgWUEpthiB3T+qNLC3iPj0zoXFi+g9rltMKvRxihiTjw/i/hnZe2HAEnWZFS7GEgchVjmEucGV10CeZqAVRG3zBiYhRmBJ9iFTu4IOZoOWVef4NPTjn+V1VnjY0elE9thSWy0QIDk8b7Djz/hTILxjSbJ8HxZxpFly5fr9ZHYh/axDNBU0YIpeZea/Pw3FQbheeoLUaMvGxlzCELgMc9s+Dlk7JUSaix7XSW4FM4JrzS2si9MjWeXvFQGhzBP1jsJikqvlO6E2IcOPsuIdhvB0RWmyaZEFvtW8+ei4qAJVGWS99TUj2ukxpmusMlASqAS8JzNL0cSneOq5gNAgXZe6GZDOax9/kCofOp3Y5XJlITU3oeU17Gns/Vp1rtoHhDSwbHCa5HtmMlGEmqSJr7ubiHiYzxUSss9VeHzQNYnH82LR+jZ5pJxhZWKmLONxSDdVAsm1eA7DiMF3hKwD3ej1JG07ZfqcQP/irrKGDYuJAPFU/z9VRXyqvIFQv9Ml43CPTUyuvUlNu0PAvVEuL9l/iA17VM5rLsU+ZmU5FBq7ZYaumpl0SlmPLkKCZ6zzkfO7fGYPzuIPH8+VOt0u/jje4jOP3npH1BHLmtNPlu7q3Hil3uCCjQipCiR2BuSyJeZL/CCY57J6BYr1/aLvxn9JjorkXRvauOJfQ+HX5dsZL4xBm0RJYWPbRqS9voI03ceo8Rq1ecG7apXbLO5QM82d7OCkJy0Ug1eBobtnwxDy8+V+2IaY4UIob2mwwrHMc36n9csV/VOKATnBHRAmWY9d9p4BTM/magKoO6Ot7Zn1RhVI777FWuHPX3PdnPTp8WiZ8734+O0ZpdXbZueC4TsI2nP0cBZssWZFMDA5oAWlnvb6GqiS5X3PC8lQY+NDEYd9+06RywUIDS2JGcxQPktbpIXK3E8Cvpy8gggN8yRirtD/fDDw4AewZXVSpzATfR4myxHedbuDckzgovisVo8r4nSkQ2ZSc7FhetXxIYvQSVMXrgnqDs9nHugD6FsnfueeNAohyhCxGE8BW22sJgF3NJxKvGNzp5f/qCvjVTSw1xiRP0fg3Za2GnnY7dBoMvpJBp2k+hROipiz7SkpDM3vSzYxr0HpTdG6+waI5rnFP9tuASnz4WAbA9RRBP2Y1Q8y8b81xn6TJEBC4qhn5C1b0TnX9ki3V+UWr+kqqAR65kGYxUewe1JbocAKXvbkoEG7sfd1r6AG7HQsy0JUgAD+5gcWKH2VSIoQkD9l0UtTkaKZo5D+HkdXq/C81/1OgBF/Ev0sL+bld2+RH8K78N+rkyxO1c3vKYmh+aZcS74Fg8hcq7aMRqqJ4KrwEv5erDjqhw6NOoIDXJkYNm5cpAgZIFzRPJhFB49zISciyiYY2+nublAcpYWBD+0Fi38U06B6EIGJcCZ/H2wrUrentxE1eS0KfvED12x/hZhjZpIxhUs7SXsg8fWt0ckSCexspapbOefVdCwGBXjNhzOcS5zQ50yPFL/ZS48oEMUQbOPgZ8owhTFasxF+luM08RiBVMAIHxY0AGwEZnEjeTVBgd63C4zNG9zqbc7IHF0O4rUO0RVMOtI6FUsQj82cDuxlDJ0LqOPARINLg7ew5BFGZ39XaRWuBuVZ/1eiBR4kw2CVhqI8tTKyKz5c05awgh9mBs1nKeQxQah3OSLM6QH5TyaM2Gyjg+A2iAr6FEQMmIJLtUQDSlMawzngy2RwOr+I4VMkfYB+u54Ytv0HPMEhDvW1kYh1cXjMKaKnDEwYsACMJXBVKF0zP94HAyM5edcSnDgAPm1Xjm4nrzStQH3h5/Rf88Aj7HUO17hHELBw0wDzCPnO49D1YU4RwGi/5L2QxMoYoVaykuYFqJ7ZbwIUhanF63oiZIukZROpArkgEXYJVRimQUX8kZcN84p6Tj/NJMXFiP4p53VBp7bvZeUaKHWYiF1bG8OMxwPIp6KSH5PtPRffblfe2Kc3Dxmh+bw7MQ5LLBUX4BPkOIHqheiV17oGtxxRdN7p8ZMA+mxHfEoohllvJ2A1ja8JC/s2vPemJsSiiLEnZT6N8jasmGTU2DDOKBoNj+4poGCHJW//kpuaEQpeGAewgNPKdhGD+qTS49wM1L70tXc3kQ7OeiUej4P9MkBMLoug4Er6lHk7/1pKFFiuiSEkH7PC9zYVFgNMXWU3Uc/dcYQ2YLzbbQskcJGHbw70zMa8OksAzr9ywpwFT2aF2Dhcn2mXFz8H3abB4GyF8cWiz6XbpQivBjnqo43NUx9MgYNGUiBMrSeJfzuSQZDj56O8cICj3wDCZ0tiNyiXcG0FZUxo8VjJGdE29u5OmFfTcO8n4SWEhsPcIEoK6+lMlfU5whZ9mXLMNJTcss/tKSJajo8epzHKEtuTqrpZC1XxdidSIXP9UG6TPXU7fk2W+vsHr1WFAHR56hNoxviJtrniujTWHicSNLj7/o91ppwwxXzArmx1lKxf9fnM4i2p+CR1KijilIketJjDTqylYlHXwaX7ytvMOxf5gEVuq9pn9wB3Jp7IiaI3FXg9YRfHzhgyzx3hsjB3TIwoOEccSKrMaicTRfZxFPoOEZiIQl77/y0J4T+VGEMnUjvhyUkK4zLB7OdJyei3b8kCugAqN6qiqaO9RB023yZqX91TNWM1UCUM9Q7GZ6cyXISOXWKK+QJd4clym3E6Aprs8XMPLZNksrfdFAR8vqLTqnoWi+eFVK6ckx7W9NyvaUQ5SpqSQ/8Xl8D3S+obndlLF+epGi3G8h6cAjz3BgMegCpDXmOcNWSpZTamO3WNNnrRYDlZY+07w+sCdkegw66ZEsZ/6MwAw4IXp724/3tbpRctKkLvF/pp7KXEUm6dRj4bah/flf9Z2X3sBRq3JTW+ccL46+oneIWFGp3n0cn5Fzf3dCcOZblUCy5iRB8I5AhdJDJOoUe32MUZDf4zHiuy6S9agdWvsScneOKUAxDA2MjWaeaG/Rh38iE5m+yxTDrULFVjbj7vREQ64QwUkVZDwFkcVZO0M8FTNxEFMiPy3XIArSB8nUhRxA3K4fTuea8N3HRPuWprfddI31a/P3zmC0oXjgZTOzJftbViVNBGyLTDhKBFgTI1OZHQhQbxm/eX6TJWf0OL0oiK9jnlrHLKRR7slrBETMGFuu/wy/SC9hS0l0fgiRENa0SSSbPWLtDo5w8zVt3LVl0KwULU63+xrl4cNVIx02a22Paa8YfhsazwaOn47sBdD5WVYUWCdxOuvD0E8xGyYvZgJK2UI6OM2QG7WeLxUxuSvY9/xI2/FEavFlX+4DLvCZbS1PMAJE3jLaQYwK9BVhnD0Vxy7jz2yWeCAvEKbTp+OqUqPe9Z782AGvRjv2tPOGOfWf50uvwp1mvP5bCmVRdVjhVnw7cPspClUUeeYCIKq4WzuBokyIGCx8+JV1woXtPTLkaN0SaButBNu5MBwoAFvjuPj6ikQTVNuWfZ++zsZTxtBjnticDEJfsivYxH+BKXrrxh5sKFa9ntCowa+M9a5dBzgUNtO1sg1E1plRFO1fILq8PAsEwDzNXxINECJHLJpdaP0oCEwjB+ry6FhhvdRiwmtM4z9HJcAkHpyOve6xBOl+aXlYP1QLLEognWqUPu6ueGYIgSVzL6KhnAhYnz+Djyk7iVcQB+hNBS0pCORnTq1ilopZzbqm994CA0zRnUiTmS+eeGRJxRp0zOq8wf/LMIYsjY49LvcYD6g6cDr0atV6mcwFVs1Aslnnql3KoEpZkummgyjl0W4xiIvRIPQtBuvO8rQk3lTbP3hyuI64+q0XOWuBkQ1zsHXXpMYcjDqqhgZdCbDtQLSvV3khAEIEZkwtiShMBKbsUT+jscEpUajJNp4SKyduLg6nXsUj/sjhPvDpfpzB5N/7VnfBtbm39iU2AugOX6LpKKYwwfxsnzFIYRMfYWwnSwDuirlOXP433Jr38VF2JtxfWl6wRss+rtTi+dxOQy83juVEGucMLtTee7gfitmVrBKJN9RsjrKrkIAeKqz2p62aTuBzTga7u4t9YuvQsBwcqYtke2uZ/pMEwpPk2MfnKhYkEB6TT1qsLfYUN6KVooeeYXo9pwJ8KvYTwku+sXhtaRNgGtvxQ2tosXWZjLub50jrbanUn4Lv7Vg9f6wC4pOCOEdzNsCgoZbSgX9F3cMmSIIHwUqfL9S/OuMmi9rDob1+9uN6LcR2P35GHC2CAQpoTtSJoDJlDUc0jlV+3nsgeZBhvgFkNH6F/xBPl/oedegJy+kU6rpEM0MZ09ttRZECEByulm18wq52qbT52oVJfFexu9Wrpoi2vIoGXrm+6mjeE2GyfijjMVyTeoV7ckjh53ym7/IE9pnKUyjfcjpCu9HLVras+kD3oUquw0bo6aKkGcvTP9obfqdEP8CI8ipDOPlk+6H9c39mScusETd5tVpHbFxAB2KdZfJ6rO9oGWm8uKswNm7bK44m6unfOG28tgyREKZi0klJhMoRgCAmcuATL3RtsXDCSy9Xg5Xe+BmGjhJ3rcsCdF/pBIjQdSw1QyeTeQBEW5i2a6oMWdfoKXDMhnSmQIcVzTOIG+9ristozD23FF7YDkRJ8WdYMiOQ09697KFowOQi2qY4K8N9NvJcwTKgdfo4LDYsG+zkqQguixES/kMMk4fCBZJPX49s6BbzSgOY3Q0qUFNwfPkVULrReqiix4L722EPeKpkTnVS13UyO8ncP6EjZMV3fakHooDqfVqHP6a8VQiNBvJ3eOzC/08zBYT/eUmdXcDSmN5Hre0kO0kxIh9icStFjqrLa/iamklG3o4r312+MNQ64tMBwfZpAtt8dbnvBJo11LJJGn2R1Qqy30GKsSGQPfl88kkxVZoqVig9FQxGtSfTt4EF3ZWcE04rKeo7dQGkxoaE9qhP291QZWvBNBGg2XMNYFnXoX05WcFYfEbAvVMjmRwGkLmPgp7+Q6LRUCuZPl7U1FS0ncBd+9WEyd2fdriweCJJHjrZwEmOvxdruS89GK4wpNKSSiq+Xh0cCYlAKUgzIcAapj5tgGedQNCGKnZ2h3ofMH4rSaY2kFToluzP+yV7SKc1JlshogTnKqCuGTR2oolLMjAOX55XLRfpBApTYGvS0qn142PWioOUuiw6oqJ4JvjQqk5BSrhg2SIMlra3Q8SC4IjEh5Vv18OITp73YwJJfHf3DI0EnWixvme1GHyUoWAbbi9a2A5AIdU6EO7JeFvNk0Ix4MlS1QfQFIrcxj6yVzT3QYuGiT/h8iLH+WDhaHKEtRC2MYNrtCNbOrY79g/CoqNkQqtC00nAim9GBz7x8ZauxbAsl5Ap4g7AJhkYrYQ/zBFOoVDF9ug3I2R3mxFbZivKjiBnVnNu+lAr1fw1y3qMJSoCdN3NVSIwR0L7GMHbWjE+5onhbbB3K/xBI3Hx7bnLJUCZr2aBCjdvdUB09dpAJHBxUw+seE1d0dKuW4wFJbpGEeRbRzMDIh+zALagtdC3txWBdARxONf3Srs0k5/Pq2nZAxY+tB87CVC9vh1tmT02tkChK96IXL/dEBrJDleFAwFGygivYrnSD8EBzG3m17KGzpuW+MBA46gDUAXCbwbDYvqOKv1ygK1JYL/EOqSrIdErrk6Dc9dM8fEo96poVjMsS9Na8+YS2EiAYxtjzXxBpr6oqOH6haID1hsi/j2zlRQKC814oV51j//5yIAq5uUmsXebboqGXxcwFn16GNRZuXM4+GjcXGEKWBhqDp0zSaB89fk0W+CvLo36C3J+1QBtOvz8M3zKehUrXko3ayZSu2LdWg1h0CMqSBIqJUhAu4y+ksfAS/F78XaWva//YPyyvXWIwFHjvO1saeU3wN5AefHfePJFi5UmlWyEaQ9lfeJ1wJ+s70Uhr+r32yCFtmr5u1pgIdWbH5/1m7/Rx4nkPzzwg0Jagq9AFZzk7ELMeeXUNtedqIeop6DIX/uF+3YIyecdmq2aFEUdlOeMoZkGWxnh8lBeIhCM7k9kqZ3rpKrHKHQkgzn8uFHdzK/FMWNLRhx1kb3NrB5vw5Nspd/koDyDezJ8Vq3Y68Dx00oGkXop4YjdpDZWWzBoiz5JCKs6kBTmKPXLz14zvifssM/Ekzc3716s0gGjfBc5raYQrGtGVynMzJB/VWoRh4ShrHbg54MkwNjgmaMKF21zeC1+1I6AFkV0of+NywN9UArWNEUpQku3lr2w+rw3UMYH2XLef45+Yh4TJTXOznVMIpK4nnNTcuNnoWDd9wlvB5Oavxvuk22XDzBxjI+Vvt+a2dfZlJYYayuNh9w64qnGd9nbJg9Ww32lzHuyVoz8NKD1K8F2iT42bb0dX+d0503RFOfo1Fq5rKGaj6sVKOrLXg9S6giqUIbJ8B3mM0KeRo+kjVdMxJZ3B6K7y5yfs8PwlPyuo/hSvx6Oysn8otpNWA7AafrivYeW5LgY1Jn0XIp2LRS0v3Jf1V1fQOKJMd1QKkYzSinrRAJbnEYdwl1NdrER+P8IXu1M0C2kajJPtTCMODXjvT6cHX2LQHspjv3kUBRVQtjqJb/iFf9JAUVfxjfuSGVllTYbI9FCgH1S8cjYIf60p3VNx7lnXY8gsj8o44sKrOKF+Ahis62XHmPYRWY6m1lMIQSorF9Rzy4uvNZ51Fiw0wg+2hbnRYDZ1S0gIAMJEIV0VARI/gnEf1f3A49hjEvIIDHelD51Sqz+FzzxGUPaZgwxBgaAFKwcfqpa/iGutTpsOVLvqwtJbXU87/jzVoby2GH8fzUfUUYo9fWEkd3N7p5cw/xUACRLQWab5d+zPlGy1u1ziQjhijDPq0pSxrRnF2H3+NndJ9G01+Hb0vYddQ10eFvwiDE3tRhjQZVro4Dg9Ibs7VIioL0GGgvWy4BfKuuuFk4fgYMaM/s+onroAUBNu/tDRNIp3WIYaZOPbj7C19jrOP0NSR4LHHwfZnzdWzAKSfGQDy8RP8Po/1J851vg0S3bg3sszEFkAhyTGTrJNOq1n/aM5/8iCdzDPhAOoULRS1ed+B8ozz88Sfbl+GlTOdihB3pmC2geDNsvZtRfT3IvWS8dNE6limV20koHEpkHRbpFEfQI5ugfFjA6p9oVblrAO2fceuc3KqfT0OWx0L50QF+o1klBBlKUNn1SbXG5EEiOy0eWRQq99uWFwKxzviSRcCEN25uINoc3BX5iJ03szorrhXhE7ig6KP+YVNEFau40tINRVoaotCEoH/t3Y6ZFmUIenXFaDzk8nvMjveHjnKMi/0QkspypEdjddmBgowUWWTOMbXiUdqvwL+4lu4894soN6k4K8T6xeM9fOlKXMAwjqz8DXaNfCQPyOHXqCfSuhI47erUecz+Z3xg38eMuXuHaO8fRWzOG2qFbPvkECMYpl2zHtEDO6SnPPQmh7UgYbmSwBBxLDjvgBe3Joz4yUG6Q/m")!important;
      background-size:1600px 780px!important;
      background-position:center!important;
      background-repeat:no-repeat!important;
      box-shadow:none!important;
    }
    .mapScene:before{inset:10px!important;border:1px solid rgba(83,52,28,.20)!important;border-radius:18px!important}
    .mapDecor{display:none!important}
    .routeSvg{width:1600px!important;height:780px!important}
    .route{stroke:#74583a!important;stroke-width:3!important;stroke-dasharray:11 12!important;opacity:.48!important}
    .route.hot{stroke:#b67b31!important;opacity:.94!important;filter:drop-shadow(0 0 3px rgba(179,122,48,.45))!important}

    /* Islands: no circular container. Existing transparent art is toned into the parchment palette.
       Ownership glow follows the alpha silhouette via drop-shadow, not a circular ring. */
    .tile{
      background:transparent!important;border:0!important;border-radius:0!important;
      box-shadow:none!important;overflow:visible!important;
    }
    .tile:before{
      content:''!important;position:absolute!important;left:50%!important;top:50%!important;inset:auto!important;
      background-image:var(--island-sprite)!important;background-repeat:no-repeat!important;
      background-size:400% 100%!important;z-index:2!important;
      filter:sepia(.30) saturate(.72) contrast(1.04)
        drop-shadow(0 2px 2px rgba(45,24,10,.34))
        drop-shadow(0 0 3px var(--owner))
        drop-shadow(0 0 7px var(--owner))!important;
      mix-blend-mode:multiply!important;
    }
    .tile.l1{width:68px!important;height:56px!important}
    .tile.l1:before{width:78px!important;height:78px!important;background-position:0 0!important;transform:translate(-50%,-52%) rotate(var(--rot,0deg))!important}
    .tile.l2{width:76px!important;height:63px!important}
    .tile.l2:before{width:88px!important;height:88px!important;background-position:33.333% 0!important;transform:translate(-50%,-52%) rotate(var(--rot,0deg))!important}
    .tile.l3{width:84px!important;height:70px!important}
    .tile.l3:before{width:98px!important;height:98px!important;background-position:66.666% 0!important;transform:translate(-50%,-53%) rotate(var(--rot,0deg))!important}
    .tile.legal{outline:2px dashed #f0c96c!important;outline-offset:4px!important;border-radius:17px!important}
    .tile.movable{outline:none!important}
    .tile.movable:before{filter:sepia(.26) saturate(.78) contrast(1.05)
      drop-shadow(0 2px 2px rgba(45,24,10,.34))
      drop-shadow(0 0 4px #fff0bd)
      drop-shadow(0 0 9px var(--owner))!important}
    .islandNo{z-index:5!important;bottom:-8px!important;font-size:8px!important;line-height:11px!important;padding:0 4px!important;background:rgba(49,33,17,.76)!important;border-color:rgba(200,169,103,.72)!important}
    .ship{z-index:6!important;top:-18px!important;font-size:21px!important}.enemyShip{font-size:18px!important}

    .base{
      width:112px!important;height:92px!important;background:transparent!important;border:0!important;border-radius:0!important;
      box-shadow:none!important;overflow:visible!important;font-size:0!important;
    }
    .base:before{
      content:''!important;position:absolute!important;left:50%!important;top:50%!important;inset:auto!important;
      width:132px!important;height:132px!important;
      background-image:var(--island-sprite)!important;background-repeat:no-repeat!important;background-size:400% 100%!important;background-position:100% 0!important;
      transform:translate(-50%,-52%)!important;z-index:2!important;
      filter:sepia(.28) saturate(.74) contrast(1.05)
        drop-shadow(0 3px 2px rgba(42,21,9,.38))
        drop-shadow(0 0 4px var(--baseColor))
        drop-shadow(0 0 9px var(--baseColor))!important;
      mix-blend-mode:multiply!important;
    }
    .base .castle{visibility:hidden!important}
    .base .baseMeta{position:relative!important;z-index:5!important;font-size:8px!important;line-height:12px!important;margin-top:65px!important;background:rgba(47,30,17,.74)!important;border:1px solid rgba(193,156,91,.72)!important;border-radius:7px!important;padding:1px 5px!important;white-space:nowrap!important}
    .base.legal{outline:3px solid #f0c96c!important;outline-offset:5px!important;border-radius:20px!important}

    /* no on-screen zoom / fit controls; pinch zoom and pan remain */
    #zoomInBtn,#zoomOutBtn,#resetMapBtn{display:none!important}
    .mapControls{top:auto!important;bottom:16px!important;left:14px!important}
    #newBtn{width:34px!important;height:34px!important;font-size:16px!important;opacity:.72!important}

    /* compact HUD */
    .topHud{padding:0 14px!important}
    .roundCard{width:220px!important;padding:4px 12px 6px!important}.roundCard b{font-size:17px!important}.roundCard span{font-size:10px!important}
    .parchmentChip{height:46px!important;min-width:88px!important;padding:5px 9px!important}.resourceIcon{width:30px!important;height:30px!important;font-size:17px!important}.resourceText b{font-size:17px!important}.resourceText small{font-size:8px!important}

    /* attack / buffs */
    #homeBtn{display:none!important}
    .bottomHud{padding:0 14px!important;justify-content:flex-end!important;pointer-events:none!important}
    .bottomHud>*{pointer-events:auto!important}
    .actionArea{display:flex!important;align-items:flex-end!important}
    .actionBtn{height:51px!important;min-width:120px!important;font-size:15px!important;border-width:3px!important}
    #rightBoosts{position:absolute!important;right:19px!important;bottom:66px!important;display:flex!important;flex-direction:column-reverse!important;gap:7px!important;pointer-events:auto!important}
    #rightBoosts .boostBtn{width:48px!important;height:48px!important;border-radius:11px!important;font-size:22px!important;padding:0!important;display:grid!important;place-items:center!important}
    #rightBoosts .boostBtn small{right:3px!important;bottom:2px!important;font-size:9px!important}

    /* 8 rounds x exactly 4 visible marks. Transparent background. */
    .turnBoard{
      background:transparent!important;border:0!important;box-shadow:none!important;
      left:92px!important;right:170px!important;transform:none!important;width:auto!important;
      min-width:0!important;max-width:none!important;height:auto!important;padding:0!important;
      bottom:max(16px,env(safe-area-inset-bottom))!important;pointer-events:none!important;
    }
    .turnCaption{display:none!important}
    .timeline{width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:18px!important}
    .roundTrack{position:relative!important;display:flex!important;grid-template-columns:none!important;gap:4px!important;padding:0 9px 0 0!important;flex:none!important}
    .roundTrack:not(:last-child):after{content:''!important;display:block!important;position:absolute!important;right:-5px!important;top:-2px!important;width:1px!important;height:10px!important;background:rgba(67,45,25,.30)!important}
    .roundTrack:before{display:none!important}
    .turnMark{display:block!important;width:12px!important;height:4px!important;border-radius:4px!important;flex:none!important;background:var(--mark)!important;opacity:1!important;box-shadow:0 1px 2px rgba(42,25,12,.50)!important}
    .turnMark.done{opacity:.58!important}
    .turnMark.current{width:16px!important;height:6px!important;opacity:1!important;outline:1px solid #fff0b7!important;box-shadow:0 0 7px #fff0b7!important;transform:none!important}
  `;
  document.head.appendChild(css);

  function applyV1Ui(){
    const svg=document.getElementById('routeSvg');
    if(svg) svg.setAttribute('viewBox','0 0 1600 780');
    const home=document.getElementById('homeBtn');
    if(home){home.style.display='none';home.setAttribute('aria-hidden','true');}
    const secret=document.getElementById('secretBtn');
    const bottom=document.querySelector('.bottomHud');
    if(secret&&bottom){
      secret.innerHTML='🗺<small>×'+(window.S&&S.players&&S.players.R?S.players.R.secret:1)+'</small>';
      let stack=document.getElementById('rightBoosts');
      if(!stack){stack=document.createElement('div');stack.id='rightBoosts';bottom.appendChild(stack);}
      stack.appendChild(secret);
    }
  }

  function sanity(){
    const tiles=document.querySelectorAll('#map [data-id]').length;
    const bases=document.querySelectorAll('[data-base]').length;
    const groups=[...document.querySelectorAll('#turnTimeline .roundTrack')];
    const marks=groups.map(g=>g.querySelectorAll('.turnMark').length);
    const totalMarks=marks.reduce((a,b)=>a+b,0);
    const ok=tiles===36&&bases===4&&groups.length===8&&marks.every(n=>n===4)&&totalMarks===32;
    window.__piratesV1Sanity={tiles,bases,roundGroups:groups.length,marks,totalMarks,ok};
    document.body.dataset.piratesV1Sanity=ok?'ok':'fail';
  }

  setTimeout(function(){applyV1Ui();sanity();if(window.resetMapView)window.resetMapView();},180);
  window.addEventListener('resize',()=>setTimeout(function(){sanity();},120));
})();