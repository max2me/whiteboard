using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace wsweb.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return Redirect("/" + Guid.NewGuid().ToString() + "/");
        }

	    public IActionResult Napkin(string napkin)
	    {
		    return View();
	    }
    }
}
