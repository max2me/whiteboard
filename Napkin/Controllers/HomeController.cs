using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Napkin.ViewModels;

// For more information on enabling MVC for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace Napkin.Controllers
{
    public class HomeController : Controller
    {
	    public IActionResult Index()
	    {
		    return View();
	    }

		[HttpPost]
        public IActionResult Index(Object ignore)
        {
			var random = new Random();
	        var name = random.Next(999).ToString("D3") + "-" + random.Next(999).ToString("D3");

			return Redirect("/" + name + "/");
        }

	    public IActionResult Napkin(string napkin)
	    {
		    return View(new NapkinViewModel()
		    {
			    Id = napkin
		    });
	    }
    }
}
